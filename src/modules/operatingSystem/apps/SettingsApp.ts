import '../../../core/bootstrap/styles/_toolbox.scss';
import { APP_INFORMATIONS } from '../../../core/constants/AppConstants';
import IModule from '../../../core/interfaces/IModule';
import {
    IConfigOption,
    IModuleConfigSchema,
} from '../../../core/interfaces/IModuleConfig';
import { ModuleManager } from '../../../core/managers/ModuleManager';
import { StorageService } from '../../../services/StorageService';
import { createElement } from '../../../utils/DomUtils';
import { SETTINGS_KEYS } from '../constants';

/**
 * Class for the settings app.
 */
export class SettingsApp {
    private moduleManager: ModuleManager;
    private storageService: StorageService;
    private expandedModuleId: string | null = null;

    /**
     * Creates a new SettingsApp instance.
     * @param moduleManager - The module manager.
     */
    public constructor(moduleManager: ModuleManager) {
        this.moduleManager = moduleManager;
        this.storageService = new StorageService();
    }

    /**
     * Renders the settings app.
     * @returns The settings app.
     */
    public render(): HTMLElement {
        const container = createElement('div', {
            class: 'tpi-modal-card os-settings-override',
            style: { display: 'flex', flexDirection: 'column', height: '100%' },
        });

        container.appendChild(this.createSearchBar());
        container.appendChild(this.createBody());
        container.appendChild(this.createFooter());

        return container;
    }

    /**
     * Creates the search bar of the settings app.
     * @returns The search bar.
     */
    private createSearchBar(): HTMLElement {
        const searchInput = createElement('input', {
            type: 'text',
            placeholder: 'Chercher un module...',
            class: 'tpi-search-input',
            oninput: (e: Event) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                this.filterModules(query);
            },
        });

        return createElement('div', { class: 'tpi-search-bar' }, [
            createElement('span', { class: 'tpi-search-icon' }, ['🔍']),
            searchInput,
        ]);
    }

    /**
     * Creates the body of the settings app.
     * @returns The body.
     */
    private createBody(): HTMLElement {
        const modules = this.moduleManager
            .getModules()
            .sort((a, b) => a.name.localeCompare(b.name));
        const list = createElement('div', {
            id: 'os-settings-list',
            class: 'tpi-modal-card__body',
        });

        list.appendChild(this.createGeneralSettingsSection());
        list.appendChild(
            createElement('div', { class: 'tpi-settings-section-header' }, ['Modules'])
        );

        if (modules.length === 0) {
            list.appendChild(
                createElement('div', { class: 'tpi-modal-empty' }, ['Aucun module disponible 😢']),
            );
            return list;
        }

        modules.forEach((mod) => {
            list.appendChild(this.createModuleRow(mod));
        });

        return list;
    }

    /**
     * Creates the general settings section.
     * @returns The general settings section.
     */
    private createGeneralSettingsSection(): HTMLElement {
        const section = createElement('div', { class: 'tpi-settings-section' });

        section.appendChild(
            createElement('div', { class: 'tpi-settings-section-header' }, ['Performances'])
        );

        // Reduce visual effects toggle
        const reduceEffectsEnabled = this.storageService.load<boolean>(SETTINGS_KEYS.REDUCE_EFFECTS, false);

        const reduceCheckbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this.storageService.save(SETTINGS_KEYS.REDUCE_EFFECTS, isChecked);
                this.applyReducedEffects(isChecked);
            },
        }) as HTMLInputElement;

        reduceCheckbox.checked = reduceEffectsEnabled;

        const reduceSwitchLabel = createElement('label', { class: 'tpi-switch' }, [
            reduceCheckbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const reduceTextContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, ['Réduire les effets visuels']),
            createElement('div', { class: 'tpi-setting-desc' }, [
                'Désactive les effets de flou et transparence pour améliorer les performances.',
            ]),
        ]);

        const reduceRow = createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': 'réduire effets visuels performance flou transparence blur',
            },
            [reduceTextContainer, reduceSwitchLabel],
        );

        section.appendChild(reduceRow);

        // Restore session toggle
        const restoreSessionEnabled = this.storageService.load<boolean>(SETTINGS_KEYS.RESTORE_SESSION, true);

        const restoreCheckbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this.storageService.save(SETTINGS_KEYS.RESTORE_SESSION, isChecked);
            },
        }) as HTMLInputElement;

        restoreCheckbox.checked = restoreSessionEnabled;

        const restoreSwitchLabel = createElement('label', { class: 'tpi-switch' }, [
            restoreCheckbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const restoreTextContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, ['Restaurer les fenêtres']),
            createElement('div', { class: 'tpi-setting-desc' }, [
                'Sauvegarde et restaure automatiquement les fenêtres ouvertes au rechargement.',
            ]),
        ]);

        const restoreRow = createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': 'restaurer fenêtres session sauvegarde reload',
            },
            [restoreTextContainer, restoreSwitchLabel],
        );

        section.appendChild(restoreRow);

        return section;
    }

    /**
     * Applies or removes reduced visual effects.
     * @param enabled - Whether to enable reduced effects.
     */
    private applyReducedEffects(enabled: boolean): void {
        if (enabled) {
            document.body.classList.add('os-reduce-effects');
        } else {
            document.body.classList.remove('os-reduce-effects');
        }
    }

    /**
     * Creates a row for a module.
     * @param module - The module to create a row for.
     * @returns The module row.
     */
    private createModuleRow(module: IModule): HTMLElement {
        const configSchema = module.getConfigSchema();
        const hasConfig = configSchema && configSchema.options.length > 0;

        const checkbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this.moduleManager.toggleModule(module.id, isChecked);
            },
        }) as HTMLInputElement;

        if (module.isEnabled()) checkbox.checked = true;

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
                        this.toggleConfigPanel(module, configSchema);
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
            const configPanel = this.createConfigPanel(module, configSchema);
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
    private toggleConfigPanel(module: IModule, schema: IModuleConfigSchema): void {
        const row = document.querySelector(`[data-module-id="${module.id}"]`);
        if (!row) return;

        const panel = row.querySelector('.tpi-config-panel') as HTMLElement;
        if (!panel) return;

        // Close any other open panels
        if (this.expandedModuleId && this.expandedModuleId !== module.id) {
            const prevRow = document.querySelector(`[data-module-id="${this.expandedModuleId}"]`);
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
            this.expandedModuleId = module.id;
            // Refresh panel values
            this.refreshConfigPanel(module, schema, panel);
        } else {
            panel.style.display = 'none';
            row.classList.remove('tpi-module-row--expanded');
            this.expandedModuleId = null;
        }
    }

    /**
     * Creates the configuration panel for a module.
     * @param module - The module.
     * @param schema - The configuration schema.
     * @returns The panel element.
     */
    private createConfigPanel(module: IModule, schema: IModuleConfigSchema): HTMLElement {
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
                            this.refreshConfigPanel(module, schema, panel);
                        }
                    },
                },
                ['↺ Réinitialiser'],
            ),
        ]);

        panel.appendChild(header);

        const optionsContainer = createElement('div', { class: 'tpi-config-options' });

        for (const option of schema.options) {
            optionsContainer.appendChild(this.createConfigOption(module, option));
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
    private refreshConfigPanel(
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
    private createConfigOption(module: IModule, option: IConfigOption): HTMLElement {
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
                control = this.createNumberInput(module, option, currentValue as number);
                break;
            case 'string':
                control = this.createStringInput(module, option, currentValue as string);
                break;
            case 'boolean':
                control = this.createBooleanInput(module, option, currentValue as boolean);
                break;
            case 'select':
                control = this.createSelectInput(module, option, currentValue as string);
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
    private createNumberInput(
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
    private createStringInput(
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
    private createBooleanInput(
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
    private createSelectInput(
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
     * Creates the footer of the settings app.
     * @returns The footer.
     */
    private createFooter(): HTMLElement {
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
     * Filters the modules based on the search query.
     * @param query - The search query.
     */
    private filterModules(query: string): void {
        const list = document.getElementById('os-settings-list');
        if (!list) return;

        const rows = list.querySelectorAll('.tpi-setting-row');
        rows.forEach((row) => {
            const el = row as HTMLElement;
            const text = el.getAttribute('data-search') || '';
            el.style.display = text.includes(query) ? 'flex' : 'none';
        });
    }
}
