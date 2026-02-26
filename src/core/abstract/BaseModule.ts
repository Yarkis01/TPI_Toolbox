import { Logger } from '../../utils/Logger';
import IModule from '../interfaces/IModule';
import { IModuleConfigSchema, ModuleConfigValues } from '../interfaces/IModuleConfig';
import { ModuleConfigManager } from '../managers/ModuleConfigManager';

/**
 * Abstract base class for application modules.
 */
export abstract class BaseModule implements IModule {
    protected _isActive: boolean;
    protected _isInitialized: boolean;
    protected _logger: Logger;
    protected _configManager: ModuleConfigManager | null = null;

    /**
     * Creates an instance of the BaseModule class.
     */
    public constructor() {
        this._isActive = false;
        this._isInitialized = false;
        this._logger = new Logger(`Module:${this.constructor.name}`);
    }

    /**
     * @inheritdoc
     */
    public abstract get id(): string;

    /**
     * @inheritdoc
     */
    public abstract get name(): string;

    /**
     * @inheritdoc
     */
    public abstract get description(): string;

    /**
     * @inheritdoc
     */
    init(): void {
        if (!this._isInitialized) {
            this._isInitialized = true;
            this._logger.info(`Initializing module: ${this.name}`);
        }
    }

    /**
     * Lazily initializes the config manager on first access.
     * @returns The config manager, or null if no schema is defined.
     */
    private _ensureConfigManager(): ModuleConfigManager | null {
        if (this._configManager) return this._configManager;

        const schema = this.getConfigSchema();
        if (schema && schema.options.length > 0) {
            this._configManager = new ModuleConfigManager(this.id, schema);
            this._logger.info(`Configuration loaded with ${schema.options.length} option(s)`);
        }

        return this._configManager;
    }

    /**
     * @inheritdoc
     */
    enable(): void {
        if (!this._isActive) {
            try {
                this.onEnable();
                this._isActive = true;
                this._logger.info(`Module enabled: ${this.name}`);
            } catch (error) {
                this._logger.error(
                    `Failed to enable module ${this.name}: ${(error as Error).message}`,
                );
            }
        }
    }

    /**
     * @inheritdoc
     */
    disable(): void {
        if (this._isActive) {
            try {
                this.onDisable();
                this._isActive = false;
                this._logger.info(`Module disabled: ${this.name}`);
            } catch (error) {
                this._logger.error(
                    `Failed to disable module ${this.name}: ${(error as Error).message}`,
                );
            }
        }
    }

    /**
     * @inheritdoc
     */
    isEnabled(): boolean {
        return this._isActive;
    }

    /**
     * @inheritdoc
     * Override this method to provide a configuration schema.
     */
    getConfigSchema(): IModuleConfigSchema | null {
        return null;
    }

    /**
     * @inheritdoc
     */
    getConfig(): ModuleConfigValues {
        return this._ensureConfigManager()?.getAll() ?? {};
    }

    /**
     * @inheritdoc
     */
    setConfigValue(key: string, value: string | number | boolean): void {
        const configManager = this._ensureConfigManager();
        if (configManager) {
            configManager.set(key, value);
            this.onConfigChanged(key, value);
        }
    }

    /**
     * @inheritdoc
     */
    resetConfig(): void {
        this._ensureConfigManager()?.reset();
        this.onConfigReset();
    }

    /**
     * Gets a typed configuration value.
     * @param key - The configuration key.
     * @param defaultValue - The default value if not found.
     * @returns The configuration value.
     */
    protected getConfigValue<T extends string | number | boolean>(key: string, defaultValue: T): T {
        return this._ensureConfigManager()?.getOrDefault(key, defaultValue) ?? defaultValue;
    }

    /**
     * Called when a configuration value changes.
     * Override to react to configuration changes.
     * @param key - The changed key.
     * @param value - The new value.
     */
    protected onConfigChanged(key: string, value: string | number | boolean): void {
        this._logger.info(`Config changed: ${key} = ${value}`);
    }

    /**
     * Called when configuration is reset.
     * Override to react to configuration reset.
     */
    protected onConfigReset(): void {
        this._logger.info('Config reset to defaults');
    }

    /**
     * Handles module enabling logic.
     */
    protected abstract onEnable(): void;

    /**
     * Handles module disabling logic.
     */
    protected abstract onDisable(): void;
}
