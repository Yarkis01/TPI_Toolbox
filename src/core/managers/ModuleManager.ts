import { Logger } from '../../utils/Logger';
import { ModuleStatusService } from '../../services/ModuleStatusService';
import IModule from '../interfaces/IModule';
import { SettingsManager } from './SettingsManager';

/**
 * Manager for application modules.
 */
export class ModuleManager {
    private readonly _modules: Map<string, IModule>;
    private readonly _settingsManager: SettingsManager;
    private readonly _logger: Logger;
    private _sortedModulesCache: IModule[] | null = null;

    /**
     * Creates an instance of the ModuleManager class.
     * @param settingsManager The settings manager instance.
     */
    public constructor(settingsManager: SettingsManager) {
        this._modules = new Map<string, IModule>();
        this._settingsManager = settingsManager;
        this._logger = new Logger('ModuleManager');
    }

    /**
     * Registers a module.
     * @param module The module to register.
     */
    public register(module: IModule): void {
        if (this._modules.has(module.id)) {
            this._logger.warn(`Module '${module.id}' is already registered.`);
            return;
        }

        this._modules.set(module.id, module);
        this._sortedModulesCache = null;

        const shouldBeEnabled = this._settingsManager.getModuleState(module.id, module.enabledByDefault);

        if (shouldBeEnabled) {
            if (!this._canEnableModule(module.id, 'register')) return;

            module.init();
            try {
                module.enable();
            } catch (error) {
                this._logger.error(`Error enabling '${module.id}': ${(error as Error).message}`);
            }
        }
    }

    /**
     * Toggles a module's enabled state.
     * @param moduleId The module identifier.
     * @param enable Whether to enable or disable the module.
     */
    public toggleModule(moduleId: string, enable: boolean): void {
        const module = this._modules.get(moduleId);
        if (module) {
            if (enable && !this._canEnableModule(moduleId, 'toggle')) return;

            if (enable) {
                module.init();
                module.enable();
            } else {
                module.disable();
            }

            this._settingsManager.setModuleState(moduleId, enable);
        }
    }

    /**
     * Gets all registered modules.
     * @returns An array of registered modules.
     */
    public getModules(): IModule[] {
        if (!this._sortedModulesCache) {
            this._sortedModulesCache = Array.from(this._modules.values()).toSorted(
                (a, b) => a.name.localeCompare(b.name),
            );
        }

        return this._sortedModulesCache;
    }

    /**
     * Checks if a module can be enabled. Logs warnings if not.
     * @param moduleId The module identifier.
     * @param action The action attempting to enable the module.
     * @returns True if it can be enabled, false otherwise.
     */
    private _canEnableModule(moduleId: string, action: 'register' | 'toggle'): boolean {
        const moduleStatus = ModuleStatusService.getInstance().getStatus(moduleId);

        if (moduleStatus.effectiveStatus === 'broken') {
            const message = action === 'register'
                ? `Module '${moduleId}' is configured to be enabled but is currently broken. Force disabled.`
                : `Attempt to enable broken module '${moduleId}'. Action blocked.`;
            this._logger.warn(message);
            return false;
        }

        if (moduleStatus.effectiveStatus === 'update_required') {
            const message = action === 'register'
                ? `Module '${moduleId}' is configured to be enabled but requires an app update. Force disabled.`
                : `Attempt to enable module '${moduleId}' requiring an update. Action blocked.`;
            this._logger.warn(message);
            return false;
        }

        return true;
    }
}
