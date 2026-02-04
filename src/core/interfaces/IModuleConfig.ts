/**
 * Types of configuration options supported.
 */
export type ConfigOptionType = 'number' | 'string' | 'boolean' | 'select';

/**
 * Base interface for a configuration option definition.
 */
export interface IConfigOptionBase {
    /** Unique key for this option */
    key: string;
    /** Display label for the option */
    label: string;
    /** Optional description/help text */
    description?: string;
    /** The type of option */
    type: ConfigOptionType;
}

/**
 * Configuration option for number values.
 */
export interface IConfigOptionNumber extends IConfigOptionBase {
    type: 'number';
    /** Default value */
    defaultValue: number;
    /** Minimum allowed value */
    min?: number;
    /** Maximum allowed value */
    max?: number;
    /** Step increment */
    step?: number;
}

/**
 * Configuration option for string values.
 */
export interface IConfigOptionString extends IConfigOptionBase {
    type: 'string';
    /** Default value */
    defaultValue: string;
    /** Maximum length */
    maxLength?: number;
    /** Placeholder text */
    placeholder?: string;
}

/**
 * Configuration option for boolean values.
 */
export interface IConfigOptionBoolean extends IConfigOptionBase {
    type: 'boolean';
    /** Default value */
    defaultValue: boolean;
}

/**
 * Configuration option for select/dropdown values.
 */
export interface IConfigOptionSelect extends IConfigOptionBase {
    type: 'select';
    /** Default value */
    defaultValue: string;
    /** Available options */
    options: Array<{ value: string; label: string }>;
}

/**
 * Union type for all configuration option types.
 */
export type IConfigOption =
    | IConfigOptionNumber
    | IConfigOptionString
    | IConfigOptionBoolean
    | IConfigOptionSelect;

/**
 * Configuration schema for a module.
 */
export interface IModuleConfigSchema {
    /** Array of configuration options */
    options: IConfigOption[];
}

/**
 * Stored configuration values (key-value pairs).
 */
export type ModuleConfigValues = Record<string, string | number | boolean>;

/**
 * Interface for modules that support configuration.
 */
export interface IConfigurableModule {
    /**
     * Returns the configuration schema for this module.
     * @returns The configuration schema, or null if no config.
     */
    getConfigSchema(): IModuleConfigSchema | null;

    /**
     * Gets the current configuration values.
     * @returns The current configuration values.
     */
    getConfig(): ModuleConfigValues;

    /**
     * Updates a configuration value.
     * @param key - The configuration key.
     * @param value - The new value.
     */
    setConfigValue(key: string, value: string | number | boolean): void;

    /**
     * Resets configuration to default values.
     */
    resetConfig(): void;
}
