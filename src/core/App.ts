import { UIManager } from '../ui/UIManager';
import { ChatOverlay } from '../ui/components/ChatOverlay';
import { HeaderWidgets } from '../ui/components/HeaderWidgets';
import { BodyModifier } from '../ui/modifiers/BodyModifier';
import { LayoutCleaner } from '../ui/modifiers/LayoutCleaner';
import { Logger } from '../utils/Logger';

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
        this._logger = new Logger('App');
        this._uiManager = new UIManager(
            [new LayoutCleaner(), new BodyModifier()],
            [new HeaderWidgets(), new ChatOverlay()],
        );
    }

    /**
     * Initializes the application.
     */
    public async initialize(): Promise<void> {
        this._logger.info('🔧 Initializing application...');

        this._uiManager.initialize();

        this._logger.info('✅ Application initialized.');
    }
}
