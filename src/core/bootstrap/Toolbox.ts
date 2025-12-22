import { APP_INFORMATIONS } from '../../core/constants/AppConstants';
import IModule from '../../core/interfaces/IModule';
import { ModuleManager } from '../../core/managers/ModuleManager';
import { UpdateSettingsManager } from '../../core/managers/UpdateSettingsManager';
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
    private readonly _updateSettings: UpdateSettingsManager;
    private _container: HTMLElement | null = null;

    /**
     * Creates an instance of the Toolbox class.
     * @param moduleManager The module manager instance.
     */
    public constructor(
        moduleManager: ModuleManager,
        updateSettings: UpdateSettingsManager = new UpdateSettingsManager(),
    ) {
        this._logger = new Logger('SettingsModal');
        this._moduleManager = moduleManager;
        this._updateSettings = updateSettings;
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

        modules.sort((a, b) => a.name.localeCompare(b.name));

        const moduleRows = modules.map((module) => this._createModuleRow(module));

        const rows: HTMLElement[] = [this._createUpdateCheckRow(), ...moduleRows];

        // If no modules exist, keep the update setting row and show an empty hint beneath.
        if (moduleRows.length === 0) {
            rows.push(
                createElement('div', { class: 'tpi-modal-empty' }, ['Aucun module disponible 😢']),
            );
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
     * Creates a row for enabling/disabling update checks.
     */
    private _createUpdateCheckRow(): HTMLElement {
        const checkbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this._updateSettings.setUpdateCheckEnabled(isChecked);
            },
        }) as HTMLInputElement;

        checkbox.checked = this._updateSettings.isUpdateCheckEnabled();

        const switchLabel = createElement('label', { class: 'tpi-switch' }, [
            checkbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const textContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, ['Recherche de mises à jour']),
            createElement('div', { class: 'tpi-setting-desc' }, [
                'Vérifie automatiquement si une nouvelle version est disponible.',
            ]),
        ]);

        return createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': 'recherche mise a jour update version github'.toLowerCase(),
            },
            [textContainer, switchLabel],
        );
    }

    /**
     * Creates a row for a module.
     * @param module The module instance.
     * @returns The row HTMLElement.
     */
    private _createModuleRow(module: IModule): HTMLElement {
        const checkbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this._moduleManager.toggleModule(module.id, isChecked);
            },
        }) as HTMLInputElement;

        checkbox.checked = module.isEnabled();

        const switchLabel = createElement('label', { class: 'tpi-switch' }, [
            checkbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const textContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, [module.name]),
            createElement('div', { class: 'tpi-setting-desc' }, [module.description]),
        ]);

        const row = createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': `${module.name} ${module.description}`.toLowerCase(),
            },
            [textContainer, switchLabel],
        );

        return row;
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
