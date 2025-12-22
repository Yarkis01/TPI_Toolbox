import { Logger } from '../../utils/Logger';
import IModule from '../interfaces/IModule';

/**
 * Abstract base class for application modules.
 */
export abstract class BaseModule implements IModule {
    protected _isActive: boolean;
    protected _logger: Logger;

    /**
     * Creates an instance of the BaseModule class.
     */
    public constructor() {
        this._isActive = false;
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
        this._logger.info(`Initializing module: ${this.name}`);
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
     * Handles module enabling logic.
     */
    protected abstract onEnable(): void;

    /**
     * Handles module disabling logic.
     */
    protected abstract onDisable(): void;
}
