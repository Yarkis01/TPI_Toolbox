import { Logger } from "../utils/Logger";
import { IModule } from "./IModule";

/**
 * Abstract base class for modules implementing common functionality.
 */
export abstract class BaseModule implements IModule {
    private _enabled: boolean = false;
    protected readonly _logger: Logger;

    /**
     * Creates an instance of BaseModule.
     * @param name The name of the module.
     */
    public constructor(name: string) {
        this._logger = new Logger(name);
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
    public abstract get description(): string | undefined;

    /**
     * @inheritdoc
     */
    public initialize(): void {
        this._logger.info(`Initializing module: ${this.name}`);
        this.onInitialize();
    }

    /**
     * @inheritdoc
     */
    public enable(): void {
        if (!this._enabled) {
            try {
                this._logger.info(`Enabling module: ${this.name}`);
                this.onEnable();
                this._enabled = true;
                this._logger.info(`Module enabled: ${this.name}`);
            } catch (error) {
                this._logger.error(`Failed to enable module ${this.name}: ${(error as Error).message}`);
            }
        }
    }

    /**
     * @inheritdoc
     */
    public disable(): void {
        if (this._enabled) {
            try {
                this._logger.info(`Disabling module: ${this.name}`);
                this.onDisable();
                this._enabled = false;
                this._logger.info(`Module disabled: ${this.name}`);
            } catch (error) {
                this._logger.error(`Failed to disable module ${this.name}: ${(error as Error).message}`);
            }
        }
    }

    /**
     * @inheritdoc
     */
    public isEnabled(): boolean {
        return this._enabled;
    }

    /**
     * Hook for module-specific initialization logic.
     */
    protected onInitialize(): void {};

    /**
     * Hook for module-specific enabling logic.
     */
    protected abstract onEnable(): void;

    /**
     * Hook for module-specific disabling logic.
     */
    protected abstract onDisable(): void;
}