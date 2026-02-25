import { StorageService } from '../../services/StorageService';
import { Logger } from '../../utils/Logger';
import {
    IConfigOption,
    IModuleConfigSchema,
    ModuleConfigValues,
} from '../interfaces/IModuleConfig';

/**
 * Manages module configurations using the StorageService.
 */
export class ModuleConfigManager {
    private static readonly CONFIG_PREFIX = 'module_config:';
    private readonly _storage: StorageService;
    private readonly _logger: Logger;
    private readonly _moduleId: string;
    private readonly _schema: IModuleConfigSchema;
    private _values: ModuleConfigValues;

    /**
     * Creates a new ModuleConfigManager.
     * @param moduleId - The unique module identifier.
     * @param schema - The configuration schema.
     */
    constructor(moduleId: string, schema: IModuleConfigSchema) {
        this._storage = new StorageService();
        this._logger = new Logger(`ConfigManager:${moduleId}`);
        this._moduleId = moduleId;
        this._schema = schema;
        this._values = this._loadConfig();
    }

    /**
     * Gets the storage key for this module's config.
     */
    private get _storageKey(): string {
        return `${ModuleConfigManager.CONFIG_PREFIX}${this._moduleId}`;
    }

    /**
     * Gets the default values from the schema.
     */
    private _getDefaults(): ModuleConfigValues {
        const defaults: ModuleConfigValues = {};
        for (const option of this._schema.options) {
            defaults[option.key] = option.defaultValue;
        }
        return defaults;
    }

    /**
     * Loads configuration from storage.
     */
    private _loadConfig(): ModuleConfigValues {
        const defaults = this._getDefaults();
        const stored = this._storage.load<ModuleConfigValues>(this._storageKey, {});

        // Merge stored values with defaults (to handle new options)
        const merged: ModuleConfigValues = { ...defaults };
        for (const key of Object.keys(stored)) {
            if (key in merged) {
                merged[key] = stored[key];
            }
        }

        return merged;
    }

    /**
     * Saves current configuration to storage.
     */
    private _saveConfig(): void {
        this._storage.save(this._storageKey, this._values);
        this._logger.info('Configuration saved');
    }

    /**
     * Gets all current configuration values.
     */
    public getAll(): ModuleConfigValues {
        return { ...this._values };
    }

    /**
     * Gets a specific configuration value.
     * @param key - The configuration key.
     * @returns The value, or undefined if not found.
     */
    public get<T extends string | number | boolean>(key: string): T | undefined {
        return this._values[key] as T | undefined;
    }

    /**
     * Gets a specific configuration value with a default fallback.
     * @param key - The configuration key.
     * @param defaultValue - The default value if not found.
     * @returns The value or the default.
     */
    public getOrDefault<T extends string | number | boolean>(key: string, defaultValue: T): T {
        const value = this._values[key];
        return value !== undefined ? (value as T) : defaultValue;
    }

    /**
     * Sets a configuration value.
     * @param key - The configuration key.
     * @param value - The new value.
     */
    public set(key: string, value: string | number | boolean): void {
        // Find the option definition
        const option = this._schema.options.find((o) => o.key === key);
        if (!option) {
            this._logger.warn(`Unknown config key: ${key}`);
            return;
        }

        // Validate the value based on type
        const validatedValue = this._validateValue(option, value);
        if (validatedValue === undefined) {
            this._logger.warn(`Invalid value for ${key}: ${value}`);
            return;
        }

        this._values[key] = validatedValue;
        this._saveConfig();
    }

    /**
     * Validates a value against an option definition.
     */
    private _validateValue(
        option: IConfigOption,
        value: string | number | boolean,
    ): string | number | boolean | undefined {
        switch (option.type) {
            case 'number': {
                const numValue = typeof value === 'number' ? value : Number(value);
                if (isNaN(numValue)) return undefined;
                if (option.min !== undefined && numValue < option.min) return option.min;
                if (option.max !== undefined && numValue > option.max) return option.max;
                return numValue;
            }
            case 'string': {
                const strValue = String(value);
                if (option.maxLength !== undefined && strValue.length > option.maxLength) {
                    return strValue.substring(0, option.maxLength);
                }
                return strValue;
            }
            case 'boolean': {
                if (typeof value === 'boolean') return value;
                if (value === 'true' || value === 1) return true;
                if (value === 'false' || value === 0) return false;
                return undefined;
            }
            case 'select': {
                const strValue = String(value);
                const validOption = option.options.find((o) => o.value === strValue);
                return validOption ? strValue : undefined;
            }
            default:
                return undefined;
        }
    }

    /**
     * Resets all configuration to default values.
     */
    public reset(): void {
        this._values = this._getDefaults();
        this._saveConfig();
        this._logger.info('Configuration reset to defaults');
    }

    /**
     * Gets the configuration schema.
     */
    public getSchema(): IModuleConfigSchema {
        return this._schema;
    }
}
