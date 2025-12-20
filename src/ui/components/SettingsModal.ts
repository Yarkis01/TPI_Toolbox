import { CONFIG, EVENTS, IDS, STRINGS } from '../../core/Config';
import { SettingsManager } from '../../core/settings/SettingsManager';
import { SettingDefinition } from '../../core/settings/SettingsSchema';
import { createElement } from '../../utils/DOMUtils';
import { Logger } from '../../utils/Logger';
import { IComponent } from '../interfaces/IComponent';
import './styles/_settings-modal.scss';

/**
 * Modal for managing toolbox settings.
 */
export class SettingsModal implements IComponent {
    private readonly _logger: Logger;
    private _settingsManager: SettingsManager;
    private _container: HTMLElement | null = null;

    /**
     * Creates an instance of SettingsModal.
     * @param settingsManager The settings manager to use.
     */
    public constructor(settingsManager: SettingsManager) {
        this._logger = new Logger('SettingsModal');
        this._settingsManager = settingsManager;
    }

    /**
     * Injects the settings modal into the document and sets up event listeners.
     */
    public inject(): void {
        document.addEventListener(EVENTS.TOOLBOX_TOGGLED, () => {
            this._logger.debug('Toggling Settings Modal');
            this._toggle();
        });
    }

    /**
     * Toggles the visibility of the settings modal.
     */
    private _toggle(): void {
        if (this._container) {
            this._close();
        } else {
            this._open();
        }
    }

    /**
     * Opens the settings modal.
     */
    private _open(): void {
        this._container = createElement('div', { 
            id: IDS.SETTINGS_MODAL, 
            class: 'tpi-modal-overlay' 
        }, [
            createElement('div', { class: 'tpi-modal-card' }, [
                this._createHeader(),
                this._createSearchBar(),
                this._createBody(),
                this._createFooter()
            ])
        ]);

        this._container.addEventListener('click', (e) => {
            if (e.target === this._container) this._close();
        });

        document.body.appendChild(this._container);
    }

    /**
     * Closes the settings modal.
     */
    private _close(): void {
        this._container?.remove();
        this._container = null;
    }

    /**
     * Creates the header element for the modal.
     * @returns The header HTMLElement.
     */
    private _createHeader(): HTMLElement {
        return createElement('div', { class: 'tpi-modal-card__header' }, [
            createElement('h2', {}, [`🔧 ${CONFIG.APP_NAME}`]),
            createElement('button', {
                class: 'tpi-close-btn',
                onclick: () => this._close()
            }, ['×'])
        ]);
    }

    /**
     * Creates the search bar element for filtering settings.
     * @returns The search bar HTMLElement.
     */
    private _createSearchBar(): HTMLElement {
        const input = createElement('input', {
            type: 'text',
            placeholder: 'Rechercher une option...',
            class: 'tpi-search-input',
            oninput: (e: Event) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                this._filterSettings(query);
            }
        });

        return createElement('div', { class: 'tpi-search-bar' }, [
            createElement('span', { class: 'tpi-search-icon' }, ['🔍']), 
            input
        ]);
    }

    /**
     * Creates the body element containing all settings.
     * @returns The body HTMLElement.
     */
    private _createBody(): HTMLElement {
        const settingsMap = this._settingsManager.getAllSettings();
        const settingsElements = Array.from(settingsMap.entries()).map(([def, isEnabled]) =>
            this._createSettingRow(def, isEnabled)
        );

        return createElement('div', { 
            id: 'tpi-settings-list',
            class: 'tpi-modal-card__body' 
        }, settingsElements);
    }

    /**
     * Creates a single setting row element.
     * @param def The setting definition.
     * @param isEnabled Whether the setting is enabled.
     * @returns The setting row HTMLElement.
     */
    private _createSettingRow(def: SettingDefinition, isEnabled: boolean): HTMLElement {
        const checkbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const target = e.target as HTMLInputElement;
                this._settingsManager.set(def.key, target.checked);
            }
        }) as HTMLInputElement;
        checkbox.checked = isEnabled;

        const switchLabel = createElement('label', { class: 'tpi-switch' }, [
            checkbox,
            createElement('span', { class: 'tpi-slider' })
        ]);

        const textContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, [def.label]),
            createElement('div', { class: 'tpi-setting-desc' }, [def.description || ''])
        ]);

        const row = createElement('div', { 
            class: 'tpi-setting-row',
            'data-search': `${def.label} ${def.description}`.toLowerCase() 
        }, [textContainer, switchLabel]);

        return row;
    }

    /**
     * Creates the footer element for the modal.
     * @returns The footer HTMLElement.
     */
    private _createFooter(): HTMLElement {
        return createElement('div', { class: 'tpi-modal-card__footer' }, [
            createElement('span', { style: { fontSize: '0.8rem', opacity: '0.5' } }, [`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} by ${CONFIG.DEVELOPER_NAME}`]),
            createElement('button', { 
                class: 'tpi-btn-primary', 
                onclick: () => document.location.reload() 
            }, [STRINGS.SAVE_SETTINGS_BUTTON])
        ]);
    }

    /**
     * Filters settings based on the search query.
     * @param query The search query.
     */
    private _filterSettings(query: string): void {
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