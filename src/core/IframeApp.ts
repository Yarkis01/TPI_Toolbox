import { Logger } from '../utils/Logger';
import { registerCommonModules } from './ModuleRegistry';
import IApp from './interfaces/IApp';
import { ModuleManager } from './managers/ModuleManager';
import { SettingsManager } from './managers/SettingsManager';

/**
 * Iframe application class.
 */
export class IframeApp implements IApp {
    private readonly _logger: Logger;

    /**
     * IframeApp constructor.
     */
    public constructor() {
        this._logger = new Logger('IframeApp');
    }

    /**
     * @inheritdoc
     */
    public async start(): Promise<void> {
        this._logger.info(`🔧 IframeApp Starting on: ${window.location.href}`);

        const settingsManager = new SettingsManager();

        if (settingsManager.getModuleState('operating_system', false)) {
            this._logger.info('🔧 Operating System Module is enabled. Enabling...');

            const moduleManager = new ModuleManager(settingsManager);
            this._initializeModules(moduleManager);
        }

    }

    /**
     * Initializes application modules.
     * @param moduleManager The module manager instance.
     */
    private _initializeModules(moduleManager: ModuleManager): void {
        this._logger.info('📦 Initializing modules in Iframe...');

        registerCommonModules(moduleManager);

        this._logger.info('✅ Modules initialized in Iframe.');
    }
}
