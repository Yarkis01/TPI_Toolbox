import { Logger } from '../utils/Logger';
import { LayoutModifier } from './ui/modifiers/LayoutModifier';
import { ChatOverlay } from './ui/components/ChatOverlay';
import { SettingsManager } from './settings/SettingsManager';
import { SettingsModal } from './ui/components/SettingsModal';
import { HeaderWidgets } from './ui/components/HeaderWidgets';

/**
 * Main application class.
 */
export class App {
    private readonly _logger: Logger;
    private readonly _settingsManager: SettingsManager;

    /**
     * Creates an instance of the App class.
     */
    public constructor() {
        this._logger = new Logger('App');
        this._settingsManager = new SettingsManager();
    }

    /**
     * Initializes the application.
     */
    public async initialize(): Promise<void> {
        this._logger.info('🔧 Initializing application...');

        this._applyLayoutModifier();

        this._logger.info('✅ Application initialized.');
    }

    /**
     * Applies the layout modifier to the application.
     */
    private _applyLayoutModifier(): void {
        this._logger.info('🔧 Applying layout modifier...')

        // Apply layout modifications
        const layoutModifier = new LayoutModifier()
        layoutModifier.apply();

        // Inject header widget
        const headerWidget = new HeaderWidgets();
        headerWidget.inject();

        // Inject settings modal
        const settingsModal = new SettingsModal(this._settingsManager);
        settingsModal.inject();

        // Inject chat overlay
        const chatOverlay = new ChatOverlay();
        chatOverlay.inject();

        this._logger.info('✅ Layout modifier applied.');
    }
}
