import { UIManager } from "../ui/UIManager";
import { Logger } from "../utils/Logger";
import { LayoutCleaner } from "../ui/modifiers/cleaners/LayoutCleaner";

/**
 * Main application class.
 */
export class App {
    private readonly _logger: Logger;
    private readonly _uiManager: UIManager;

    /**
     * Creates an instance of the App class.
     */
    public constructor() {
        this._logger = new Logger("App");
        this._uiManager = new UIManager([
            new LayoutCleaner()
        ]);
    }

    /**
     * Initializes the application.
     */
    public async initialize(): Promise<void> {
        this._logger.info("🔧 Initializing application...")
        
        this._uiManager.initialize();

        this._logger.info("✅ Application initialized.");
    }
}