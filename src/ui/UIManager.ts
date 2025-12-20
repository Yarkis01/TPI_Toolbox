import { Logger } from "../utils/Logger";
import { ICleaner } from "./modifiers/ICleaner";

/**
 * UI Manager class to handle UI modifications and cleaning.
 */
export class UIManager {
    private readonly _logger: Logger;
    private readonly _cleaners: ICleaner[];

    /**
     * Creates an instance of UIManager.
     * @param cleaners - Array of ICleaner instances to apply to the UI.
     */
    public constructor(cleaners: ICleaner[]) {
        this._logger = new Logger("UIManager");

        this._cleaners = cleaners;
    }

    /**
     * Initializes the UI Manager and applies all cleaners.
     */
    public initialize(): void {
        this._logger.info("🖌️ Initializing UI Manager...");

        this._sanitize();
        
        this._logger.info("🖌️ UI Manager initialized.");
    }

    /**
     * Sanitizes the UI by applying all registered cleaners.
     */
    private _sanitize(): void {
        this._logger.info("🧹 Sanitizing UI...");

        this._cleaners.forEach((cleaner) => {
            try {
                cleaner.clean();
            } catch (error) {
                this._logger.error(`Failed to apply cleaner: ${(error as Error).message}`);
            }
        })

        this._logger.info("✨ UI sanitized.");
    }
}