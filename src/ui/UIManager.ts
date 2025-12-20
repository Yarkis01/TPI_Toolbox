import { Logger } from '../utils/Logger';
import { IComponent } from './interfaces/IComponent';
import { IModifier } from './interfaces/IModifier';

/**
 * UI Manager class to handle UI modifications and cleaning.
 */
export class UIManager {
    private readonly _logger: Logger;
    private readonly _cleaners: IModifier[];
    private readonly _components: IComponent[];

    /**
     * Creates an instance of UIManager.
     * @param cleaners - Array of ICleaner instances to apply to the UI.
     */
    public constructor(cleaners: IModifier[], components: IComponent[]) {
        this._logger = new Logger('UIManager');

        this._cleaners = cleaners;
        this._components = components;

        this._logger.info(
            `UIManager initialized with ${this._cleaners.length} cleaners and ${this._components.length} components.`,
        );
    }

    /**
     * Initializes the UI Manager and applies all cleaners.
     */
    public initialize(): void {
        this._logger.info('🖌️ Initializing UI Manager...');

        this._sanitize();
        this._injectComponents();

        this._logger.info('✅ UI Manager initialized.');
    }

    /**
     * Sanitizes the UI by applying all registered cleaners.
     */
    private _sanitize(): void {
        this._logger.info('🧹 Sanitizing UI...');

        this._cleaners.forEach((cleaner) => {
            try {
                cleaner.apply();
            } catch (error) {
                this._logger.error(`Failed to apply cleaner: ${(error as Error).message}`);
            }
        });

        this._logger.info('✅ UI sanitized.');
    }

    /**
     * Injects all registered UI components.
     */
    private _injectComponents(): void {
        this._logger.info('🔌 Injecting UI components...');

        this._components.forEach((component) => {
            try {
                component.inject();
            } catch (error) {
                this._logger.error(`Failed to inject component: ${(error as Error).message}`);
            }
        });

        this._logger.info('✅ UI components injected.');
    }
}
