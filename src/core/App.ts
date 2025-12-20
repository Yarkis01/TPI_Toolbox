import { UIManager } from '../ui/UIManager';
import { ChatOverlay } from '../ui/components/ChatOverlay';
import { HeaderWidgets } from '../ui/components/HeaderWidgets';
import { SettingsModal } from '../ui/components/SettingsModal';
import { BodyModifier } from '../ui/modifiers/BodyModifier';
import { LayoutCleaner } from '../ui/modifiers/LayoutCleaner';
import { Logger } from '../utils/Logger';
import { SettingsManager } from './settings/SettingsManager';

/**
 * Main application class.
 */
export class App {
    private readonly _logger: Logger;
    private readonly _settingsManager: SettingsManager;
    private readonly _uiManager: UIManager;

    /**
     * Creates an instance of the App class.
     */
    public constructor() {
        this._logger = new Logger('App');
        this._settingsManager = new SettingsManager();
        this._uiManager = new UIManager(
            [new LayoutCleaner(), new BodyModifier()],
            [new HeaderWidgets(), new ChatOverlay(), new SettingsModal(this._settingsManager)],
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
