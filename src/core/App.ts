import { UIManager } from '../ui/UIManager';
import { Logger } from '../utils/Logger';
import { ComponentsLoader } from './loaders/ComponentsLoader';
import { ModifiersLoader } from './loaders/ModifiersLoader';
import { SettingsManager } from './settings/SettingsManager';

/**
 * Main application class.
 */
export class App {
    private readonly _logger: Logger;
    private readonly _settingsManager: SettingsManager;
    private readonly _modifiersLoader: ModifiersLoader;
    private readonly _componentsLoader: ComponentsLoader;
    private readonly _uiManager: UIManager;

    /**
     * Creates an instance of the App class.
     */
    public constructor() {
        this._logger = new Logger('App');

        this._settingsManager = new SettingsManager();
        this._modifiersLoader = new ModifiersLoader(this._settingsManager);
        this._componentsLoader = new ComponentsLoader(this._settingsManager);

        this._uiManager = new UIManager(
            this._modifiersLoader.loadModifiers(),
            this._componentsLoader.loadComponents(),
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
