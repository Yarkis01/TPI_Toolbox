import { APP_INFORMATIONS } from '../../core/constants/AppConstants';
import IModule from '../../core/interfaces/IModule';
import {
    IConfigOption,
    IModuleConfigSchema,
} from '../../core/interfaces/IModuleConfig';
import { ModuleManager } from '../../core/managers/ModuleManager';
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
    private _container: HTMLElement | null = null;
    private _expandedModuleId: string | null = null;

    /**
     * Creates an instance of the Toolbox class.
     * @param moduleManager The module manager instance.
     */
    public constructor(moduleManager: ModuleManager) {
        this._logger = new Logger('SettingsModal');
        this._moduleManager = moduleManager;
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
        this._expandedModuleId = null;
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

        const rows = modules.map((module) => this._createModuleRow(module));

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
     * Creates a row for a module.
     * @param module The module instance.
     * @returns The row HTMLElement.
     */
    private _createModuleRow(module: IModule): HTMLElement {
        const configSchema = module.getConfigSchema();
        const hasConfig = configSchema && configSchema.options.length > 0;

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

        // Create controls container (config button + switch)
        const controlsContainer = createElement('div', { class: 'tpi-setting-controls' }, []);

        // Add config button if module has configuration
        if (hasConfig) {
            const configBtn = createElement(
                'button',
                {
                    class: 'tpi-config-btn',
                    title: 'Configurer le module',
                    onclick: (e: Event) => {
                        e.stopPropagation();
                        this._toggleConfigPanel(module, configSchema);
                    },
                },
                ['⚙️'],
            );
            controlsContainer.appendChild(configBtn);
        }

        controlsContainer.appendChild(switchLabel);

        const row = createElement(
            'div',
            {
                class: 'tpi-setting-row tpi-module-row',
                'data-module-id': module.id,
                'data-search': `${module.name} ${module.description}`.toLowerCase(),
            },
            [textContainer, controlsContainer],
        );

        // Add config panel container (hidden by default)
        if (hasConfig) {
            const configPanel = this._createConfigPanel(module, configSchema);
            configPanel.style.display = 'none';
            row.appendChild(configPanel);
        }

        return row;
    }

    /**
     * Toggles the configuration panel for a module.
     * @param module - The module.
     * @param schema - The configuration schema.
     */
    private _toggleConfigPanel(module: IModule, schema: IModuleConfigSchema): void {
        const row = document.querySelector(`[data-module-id="${module.id}"]`);
        if (!row) return;

        const panel = row.querySelector('.tpi-config-panel') as HTMLElement;
        if (!panel) return;

        // Close any other open panels
        if (this._expandedModuleId && this._expandedModuleId !== module.id) {
            const prevRow = document.querySelector(`[data-module-id="${this._expandedModuleId}"]`);
            const prevPanel = prevRow?.querySelector('.tpi-config-panel') as HTMLElement;
            if (prevPanel) {
                prevPanel.style.display = 'none';
                prevRow?.classList.remove('tpi-module-row--expanded');
            }
        }

        // Toggle current panel
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            row.classList.add('tpi-module-row--expanded');
            this._expandedModuleId = module.id;
            // Refresh panel values
            this._refreshConfigPanel(module, schema, panel);
        } else {
            panel.style.display = 'none';
            row.classList.remove('tpi-module-row--expanded');
            this._expandedModuleId = null;
        }
    }

    /**
     * Creates the configuration panel for a module.
     * @param module - The module.
     * @param schema - The configuration schema.
     * @returns The panel element.
     */
    private _createConfigPanel(module: IModule, schema: IModuleConfigSchema): HTMLElement {
        const panel = createElement('div', { class: 'tpi-config-panel' });

        const header = createElement('div', { class: 'tpi-config-panel__header' }, [
            createElement('span', {}, ['Configuration']),
            createElement(
                'button',
                {
                    class: 'tpi-config-reset-btn',
                    title: 'Réinitialiser les paramètres',
                    onclick: () => {
                        if (confirm('Réinitialiser tous les paramètres de ce module ?')) {
                            module.resetConfig();
                            this._refreshConfigPanel(module, schema, panel);
                        }
                    },
                },
                ['↺ Réinitialiser'],
            ),
        ]);

        panel.appendChild(header);

        const optionsContainer = createElement('div', { class: 'tpi-config-options' });

        for (const option of schema.options) {
            optionsContainer.appendChild(this._createConfigOption(module, option));
        }

        panel.appendChild(optionsContainer);

        return panel;
    }

    /**
     * Refreshes the configuration panel values.
     * @param module - The module.
     * @param schema - The configuration schema.
     * @param panel - The panel element.
     */
    private _refreshConfigPanel(
        module: IModule,
        schema: IModuleConfigSchema,
        panel: HTMLElement,
    ): void {
        const config = module.getConfig();
        const optionsContainer = panel.querySelector('.tpi-config-options');
        if (!optionsContainer) return;

        for (const option of schema.options) {
            const input = optionsContainer.querySelector(
                `[data-config-key="${option.key}"]`,
            ) as HTMLInputElement | HTMLSelectElement;

            if (input) {
                const value = config[option.key] ?? option.defaultValue;
                if (option.type === 'boolean') {
                    (input as HTMLInputElement).checked = value as boolean;
                } else {
                    input.value = String(value);
                }
            }
        }
    }

    /**
     * Creates a configuration option control.
     * @param module - The module.
     * @param option - The option definition.
     * @returns The option element.
     */
    private _createConfigOption(module: IModule, option: IConfigOption): HTMLElement {
        const config = module.getConfig();
        const currentValue = config[option.key] ?? option.defaultValue;

        const row = createElement('div', { class: 'tpi-config-option' });

        const labelContainer = createElement('div', { class: 'tpi-config-option__label' }, [
            createElement('span', { class: 'tpi-config-option__name' }, [option.label]),
        ]);

        if (option.description) {
            labelContainer.appendChild(
                createElement('span', { class: 'tpi-config-option__desc' }, [option.description]),
            );
        }

        row.appendChild(labelContainer);

        let control: HTMLElement;

        switch (option.type) {
            case 'number':
                control = this._createNumberInput(module, option, currentValue as number);
                break;
            case 'string':
                control = this._createStringInput(module, option, currentValue as string);
                break;
            case 'boolean':
                control = this._createBooleanInput(module, option, currentValue as boolean);
                break;
            case 'select':
                control = this._createSelectInput(module, option, currentValue as string);
                break;
            default:
                control = createElement('span', {}, ['Type non supporté']);
        }

        row.appendChild(control);

        return row;
    }

    /**
     * Creates a number input control.
     */
    private _createNumberInput(
        module: IModule,
        option: IConfigOption & { type: 'number' },
        value: number,
    ): HTMLElement {
        const container = createElement('div', { class: 'tpi-config-number' });

        const inputAttrs: Record<string, string | Function> = {
            type: 'number',
            class: 'tpi-config-input',
            'data-config-key': option.key,
            value: String(value),
            onchange: (e: Event) => {
                const newValue = Number((e.target as HTMLInputElement).value);
                module.setConfigValue(option.key, newValue);
            },
        };

        if (option.min !== undefined) inputAttrs.min = String(option.min);
        if (option.max !== undefined) inputAttrs.max = String(option.max);
        if (option.step !== undefined) inputAttrs.step = String(option.step);

        const input = createElement('input', inputAttrs) as HTMLInputElement;

        container.appendChild(input);

        return container;
    }

    /**
     * Creates a string input control.
     */
    private _createStringInput(
        module: IModule,
        option: IConfigOption & { type: 'string' },
        value: string,
    ): HTMLElement {
        const inputAttrs: Record<string, string | Function> = {
            type: 'text',
            class: 'tpi-config-input',
            'data-config-key': option.key,
            value: value,
            placeholder: option.placeholder || '',
            onchange: (e: Event) => {
                const newValue = (e.target as HTMLInputElement).value;
                module.setConfigValue(option.key, newValue);
            },
        };

        if (option.maxLength !== undefined) inputAttrs.maxlength = String(option.maxLength);

        const input = createElement('input', inputAttrs) as HTMLInputElement;

        return input;
    }

    /**
     * Creates a boolean toggle control.
     */
    private _createBooleanInput(
        module: IModule,
        option: IConfigOption & { type: 'boolean' },
        value: boolean,
    ): HTMLElement {
        const checkbox = createElement('input', {
            type: 'checkbox',
            'data-config-key': option.key,
            onchange: (e: Event) => {
                const newValue = (e.target as HTMLInputElement).checked;
                module.setConfigValue(option.key, newValue);
            },
        }) as HTMLInputElement;

        checkbox.checked = value;

        const switchLabel = createElement('label', { class: 'tpi-switch tpi-switch--small' }, [
            checkbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        return switchLabel;
    }

    /**
     * Creates a select dropdown control.
     */
    private _createSelectInput(
        module: IModule,
        option: IConfigOption & { type: 'select' },
        value: string,
    ): HTMLElement {
        const select = createElement('select', {
            class: 'tpi-config-select',
            'data-config-key': option.key,
            onchange: (e: Event) => {
                const newValue = (e.target as HTMLSelectElement).value;
                module.setConfigValue(option.key, newValue);
            },
        }) as HTMLSelectElement;

        for (const opt of option.options) {
            const optionEl = createElement('option', { value: opt.value }, [
                opt.label,
            ]) as HTMLOptionElement;
            if (opt.value === value) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        }

        return select;
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
