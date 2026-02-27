import { Logger } from '../../../utils/Logger';
import IFeature from '../interfaces/IFeature';

/**
 * Abstract base class for planning features.
 * Provides lifecycle management, logging, and error handling.
 */
export abstract class BaseFeature implements IFeature {
    protected _isActive: boolean = false;
    private _loggerInstance: Logger | null = null;

    /**
     * Lazily initialized logger — only created on first access.
     */
    protected get _logger(): Logger {
        if (!this._loggerInstance) {
            this._loggerInstance = new Logger(`Feature:${this.constructor.name}`);
        }
        return this._loggerInstance;
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
    public get enabledByDefault(): boolean {
        return true;
    }

    /**
     * @inheritdoc
     */
    public enable(): void {
        if (!this._isActive) {
            try {
                this.onEnable();
                this._isActive = true;
                this._logger.info(`Feature enabled: ${this.name}`);
            } catch (error) {
                this._logger.error(
                    `Failed to enable feature ${this.name}: ${(error as Error).message}`,
                );
            }
        }
    }

    /**
     * @inheritdoc
     */
    public disable(): void {
        if (this._isActive) {
            try {
                this.onDisable();
                this._isActive = false;
                this._logger.info(`Feature disabled: ${this.name}`);
            } catch (error) {
                this._logger.error(
                    `Failed to disable feature ${this.name}: ${(error as Error).message}`,
                );
            }
        }
    }

    /**
     * @inheritdoc
     */
    public isEnabled(): boolean {
        return this._isActive;
    }

    /**
     * Handles feature enabling logic.
     * Implement this to apply DOM modifications.
     */
    protected abstract onEnable(): void;

    /**
     * Handles feature disabling logic.
     * Implement this to revert DOM modifications.
     */
    protected abstract onDisable(): void;
}
