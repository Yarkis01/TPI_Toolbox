import { IModuleConfigSchema, ModuleConfigValues } from './IModuleConfig';

/**
 * Interface for application modules.
 */
export default interface IModule {
    /**
     * Module unique identifier.
     */
    get id(): string;

    /**
     * Module name.
     */
    get name(): string;

    /**
     * Module description.
     */
    get description(): string;

    /**
     * Whether the module should be enabled by default.
     */
    get enabledByDefault(): boolean;

    /**
     * Initializes the module.
     */
    init(): void;

    /**
     * Enables the module.
     */
    enable(): void;

    /**
     * Disables the module.
     */
    disable(): void;

    /**
     * Checks if the module is enabled.
     * @return True if the module is enabled, false otherwise.
     */
    isEnabled(): boolean;

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
