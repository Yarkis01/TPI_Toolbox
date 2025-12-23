import { EntityStatusColorizerModule } from '../modules/EntityStatusColorizer/module';
import { HideWarehousemanModule } from '../modules/hideWarehouseman/module';
import { RideHypeAsTextModule } from '../modules/rideHypeAsText/module';
import { SelectUntrainedModule } from '../modules/selectUntrained/module';
import { ZoneFilterModule } from '../modules/zoneFilters/module';
import { Logger } from '../utils/Logger';
import { BaseLayout } from './bootstrap/BaseLayout';
import { ChatLayout } from './bootstrap/ChatLayout';
import { HeaderLayout } from './bootstrap/HeaderLayout';
import { Toolbox } from './bootstrap/Toolbox';
import IApp from './interfaces/IApp';
import IBootstrap from './interfaces/IBootstrap';
import { ModuleManager } from './managers/ModuleManager';
import { SettingsManager } from './managers/SettingsManager';

/**
 * Main application class.
 */
export class App implements IApp {
    private readonly _logger: Logger;

    /**
     * App constructor.
     */
    public constructor() {
        this._logger = new Logger('App');
    }

    /**
     * @inheritdoc
     */
    public async start(): Promise<void> {
        this._logger.info('🔧 Toolbox Starting...');

        const settingsManager = new SettingsManager();
        const moduleManager = new ModuleManager(settingsManager);

        this._runBootstrapProcesses(moduleManager);
        this._initializeModules(moduleManager);

        this._logger.info('🚀 Toolbox Started.');
    }

    /**
     * Runs all bootstrap processes.
     * @param moduleManager The module manager instance.
     */
    private _runBootstrapProcesses(moduleManager: ModuleManager): void {
        this._logger.info('⚙️ Running bootstrap processes...');

        const bootstraps: IBootstrap[] = [
            new BaseLayout(),
            new HeaderLayout(),
            new ChatLayout(),
            new Toolbox(moduleManager),
        ];

        bootstraps.forEach((bootstrap) => {
            try {
                bootstrap.run();
                this._logger.info(
                    `✅ Bootstrap process ${bootstrap.constructor.name} completed successfully.`,
                );
            } catch (error) {
                this._logger.error(
                    `❌ Bootstrap process ${bootstrap.constructor.name} failed: ${(error as Error).message}`,
                );
            }
        });
    }

    /**
     * Initializes application modules.
     * @param moduleManager The module manager instance.
     */
    private _initializeModules(moduleManager: ModuleManager): void {
        this._logger.info('📦 Initializing modules...');

        moduleManager.register(new EntityStatusColorizerModule());
        moduleManager.register(new RideHypeAsTextModule());
        moduleManager.register(new ZoneFilterModule());
        moduleManager.register(new HideWarehousemanModule());
        moduleManager.register(new SelectUntrainedModule());

        this._logger.info('✅ Modules initialized.');
    }
}
