import { APP_INFORMATIONS } from '../../core/constants/AppConstants';
import IModule from '../../core/interfaces/IModule';
import { ModuleManager } from '../../core/managers/ModuleManager';
import { ModuleConfigRenderer } from '../../core/utils/ModuleConfigRenderer';
import { createElement } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { EVENTS, IDS } from '../constants/LayoutConstants';
import IBootstrap from '../interfaces/IBootstrap';
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
        const rows = modules.map((module) => this._configRenderer.createModuleRow(
            module,
            (isChecked) => this._moduleManager.toggleModule(module.id, isChecked)
        ));

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
