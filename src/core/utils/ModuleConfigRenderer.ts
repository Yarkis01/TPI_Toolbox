import { createElement } from '../../utils/DomUtils';
import IModule from '../interfaces/IModule';
import { IConfigOption, IModuleConfigSchema } from '../interfaces/IModuleConfig';

/**
 * Utility class for rendering module configuration UI components.
 * Shared between Toolbox and SettingsApp.
 */
export class ModuleConfigRenderer {
    private _expandedModuleId: string | null = null;

    /**
     * Creates module row controls (config button + switch).
     * @param module - The module.
     * @param onToggle - Callback when module is toggled.
     * @returns Object with controlsContainer and optional configPanel.
     */
    public createModuleControls(
        module: IModule,
        onToggle: (isChecked: boolean) => void,
    ): { controls: HTMLElement; configPanel: HTMLElement | null } {
        const configSchema = module.getConfigSchema();
        const hasConfig = configSchema && configSchema.options.length > 0;

        const checkbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                onToggle(isChecked);
            },
        }) as HTMLInputElement;

        checkbox.checked = module.isEnabled();

        const switchLabel = createElement('label', { class: 'tpi-switch' }, [
            checkbox,
            createElement('span', { class: 'tpi-slider' }),
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

        // Create config panel if needed
        let configPanel: HTMLElement | null = null;
        if (hasConfig) {
            configPanel = this.createConfigPanel(module, configSchema);
            configPanel.style.display = 'none';
        }

        return { controls: controlsContainer, configPanel };
    }

    /**
     * Toggles the configuration panel for a module.
     * @param module - The module.
     * @param schema - The configuration schema.
     */
    public toggleConfigPanel(module: IModule, schema: IModuleConfigSchema): void {
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
            this.refreshConfigPanel(module, schema, panel);
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
    public createConfigPanel(module: IModule, schema: IModuleConfigSchema): HTMLElement {
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
    public refreshConfigPanel(
        module: IModule,
        schema: IModuleConfigSchema,
        panel: HTMLElement,
    ): void {
        const config = module.getConfig();
        const optionsContainer = panel.querySelector('.tpi-config-options');
        if (!optionsContainer) return;

        for (const option of schema.options) {
            const input = optionsContainer.querySelector(`[data-config-key="${option.key}"]`) as
                | HTMLInputElement
                | HTMLSelectElement;

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
    public createConfigOption(module: IModule, option: IConfigOption): HTMLElement {
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
    public createNumberInput(
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
    public createStringInput(
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
    public createBooleanInput(
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
    public createSelectInput(
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
     * Resets the expanded state.
     */
    public resetExpandedState(): void {
        this._expandedModuleId = null;
    }
}
