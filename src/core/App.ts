import { UIManager } from '../ui/UIManager';
import { ChatOverlay } from '../ui/components/ChatOverlay';
import { HeaderWidgets } from '../ui/components/HeaderWidgets';
import { SettingsModal } from '../ui/components/SettingsModal';
import { IComponent } from '../ui/interfaces/IComponent';
import { IModifier } from '../ui/interfaces/IModifier';
import { BodyModifier } from '../ui/modifiers/BodyModifier';
import { LayoutCleaner } from '../ui/modifiers/LayoutCleaner';
import { RideHypeAsTextModifier } from '../ui/modifiers/RideHypeAsTextModifier';
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
        this._uiManager = new UIManager(this._createModifiers(), this._createComponents());
    }

    /**
     * Creates the list of modifiers to be used in the application.
     * @returns An array of IModifier instances.
     */
    private _createModifiers(): IModifier[] {
        let modifiers: IModifier[] = [new LayoutCleaner(), new BodyModifier()];

        if (this._settingsManager.isEnabled('showRideHypeAsText')) {
            this._logger.info('🚀 Enabling Ride Hype As Text modifier.');
            modifiers.push(new RideHypeAsTextModifier());
        }

        return modifiers;
    }

    /**
     * Creates the list of components to be used in the application.
     * @returns An array of IComponent instances.
     */
    private _createComponents(): IComponent[] {
        let components: IComponent[] = [
            new HeaderWidgets(),
            new ChatOverlay(),
            new SettingsModal(this._settingsManager),
        ];

        return components;
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
