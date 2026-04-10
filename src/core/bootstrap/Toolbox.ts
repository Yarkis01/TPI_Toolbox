import { APP_INFORMATIONS } from '../../core/constants/AppConstants';
import { ModuleManager } from '../../core/managers/ModuleManager';
import { ModuleConfigRenderer } from '../../core/utils/ModuleConfigRenderer';
import { createElement } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { EVENTS, IDS, SELECTORS } from '../constants/LayoutConstants';
import IBootstrap from '../interfaces/IBootstrap';
import './styles/_header.scss';
import './styles/_toolbox.scss';

/**
 * Modal for managing toolbox modules.
 */
export class Toolbox implements IBootstrap {
    private readonly _logger: Logger;
    private readonly _moduleManager: ModuleManager;
    private readonly _configRenderer: ModuleConfigRenderer;
    private _container: HTMLElement | null = null;

    /**
     * Creates an instance of the Toolbox class.
     * @param moduleManager The module manager instance.
     */
    public constructor(moduleManager: ModuleManager) {
        this._logger = new Logger('SettingsModal');
        this._moduleManager = moduleManager;
        this._configRenderer = new ModuleConfigRenderer();
    }

    /**
     * @inheritdoc
     */
    public run(): void {
        this._injectSidebarLink();

        document.addEventListener(EVENTS.TOOLBOX_TOGGLED, () => {
            this._toggle();
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') {
                this._toggle();
            }
        });
    }

    /**
     * Injects the toolbox trigger link into the sidebar, after the "Jour suivant" link.
     */
    private _injectSidebarLink(): void {
        const newDayLink = document.querySelector<HTMLAnchorElement>(SELECTORS.NEW_DAY_LINK);

        if (!newDayLink) {
            this._logger.warn('Sidebar "Jour suivant" link not found, skipping sidebar injection.');
            return;
        }

        const link = createElement(
            'a',
            {
                id: IDS.SIDEBAR_TOOLBOX_LINK,
                class: 'app-sidebar__link app-sidebar__link--toolbox',
                href: '#',
                onclick: (e: Event) => {
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent(EVENTS.TOOLBOX_TOGGLED));
                },
            },
            [this._createSidebarIcon(), APP_INFORMATIONS.APP_NAME],
        );

        newDayLink.insertAdjacentElement('afterend', link);
        this._logger.info('Sidebar toolbox link injected.');
    }

    /**
     * Creates the toolbox SVG icon matching the sidebar icon style.
     * @returns The SVG element.
     */
    private _createSidebarIcon(): SVGElement {
        const NS = 'http://www.w3.org/2000/svg';

        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'app-sidebar__link-icon');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', '#35b3af');
        svg.setAttribute('aria-hidden', 'true');

        const path = document.createElementNS(NS, 'path');
        path.setAttribute(
            'd',
            'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
        );
        svg.appendChild(path);

        return svg;
    }

    /**
     * Toggles the modal open/close state.
     */
    private _toggle(): void {
        if (this._container) {
            this._close();
        } else {
            this._open();
        }
    }

    /**
     * Opens the modal.
     */
    private _open(): void {
        if (this._container) return;

        const content = createElement('div', { class: 'tpi-modal-card' }, [
            this._createHeader(),
            this._createSearchBar(),
            this._createBody(),
            this._createFooter(),
        ]);

        this._container = createElement(
            'div',
            {
                id: IDS.SETTINGS_MODAL,
                class: 'tpi-modal-overlay',
            },
            [content],
        );

        this._container.addEventListener('click', (e) => {
            if (e.target === this._container) this._close();
        });

        document.body.appendChild(this._container);
    }

    /**
     * Closes the modal.
     */
    private _close(): void {
        this._container?.remove();
        this._container = null;
        this._configRenderer.resetExpandedState();
    }

    /**
     * Creates the header element.
     * @returns The header HTMLElement.
     */
    private _createHeader(): HTMLElement {
        return createElement('div', { class: 'tpi-modal-card__header' }, [
            createElement('h2', {}, [`🔧 ${APP_INFORMATIONS.APP_NAME || 'Toolbox'}`]),
            createElement(
                'button',
                {
                    class: 'tpi-close-btn',
                    onclick: () => this._close(),
                    title: 'Fermer',
                },
                ['×'],
            ),
        ]);
    }

    /**
     * Creates the search bar element.
     * @returns The search bar HTMLElement.
     */
    private _createSearchBar(): HTMLElement {
        const searchInput = createElement('input', {
            type: 'text',
            placeholder: 'Chercher un module...',
            class: 'tpi-search-input',
            oninput: (e: Event) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                this._filterModules(query);
            },
        });

        return createElement('div', { class: 'tpi-search-bar' }, [
            createElement('span', { class: 'tpi-search-icon' }, ['🔍']),
            searchInput,
        ]);
    }

    /**
     * Creates the body element containing the module list.
     * @returns The body HTMLElement.
     */
    private _createBody(): HTMLElement {
        const modules = this._moduleManager.getModules();
        const rows = modules.map((module) =>
            this._configRenderer.createModuleRow(module, (isChecked) =>
                this._moduleManager.toggleModule(module.id, isChecked),
            ),
        );

        if (rows.length === 0) {
            return createElement('div', { class: 'tpi-modal-empty' }, [
                'Aucun module disponible 😢',
            ]);
        }

        return createElement(
            'div',
            {
                id: 'tpi-settings-list',
                class: 'tpi-modal-card__body',
            },
            rows,
        );
    }

    /**
     * Creates the footer element.
     * @returns The footer HTMLElement.
     */
    private _createFooter(): HTMLElement {
        return createElement('div', { class: 'tpi-modal-card__footer' }, [
            createElement('span', { class: 'tpi-version' }, [`v${APP_INFORMATIONS.APP_VERSION}`]),
            createElement(
                'button',
                {
                    class: 'tpi-btn-primary',
                    onclick: () => window.location.reload(),
                },
                ['Recharger la page ↻'],
            ),
        ]);
    }

    /**
     * Filters modules based on the search query.
     * @param query The search query.
     */
    private _filterModules(query: string): void {
        const list = document.getElementById('tpi-settings-list');
        if (!list) return;

        const rows = list.querySelectorAll('.tpi-setting-row');
        rows.forEach((row) => {
            const el = row as HTMLElement;
            const text = el.getAttribute('data-search') || '';
            el.style.display = text.includes(query) ? 'flex' : 'none';
        });
    }
}
