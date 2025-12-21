import { StorageService } from '../../services/StorageService';
import { Logger } from '../../utils/Logger';

/**
 * SettingsManager handles the storage and retrieval of module settings.
 */
export class SettingsManager {
    private readonly _storage: StorageService;
    private readonly _logger: Logger;
    private readonly _cache: Map<string, boolean>;

    /**
     * SettingsManager constructor.
     */
    public constructor() {
        this._logger = new Logger('SettingsManager');
        this._storage = new StorageService();
        this._cache = new Map<string, boolean>();
    }

    /**
     * Retrieves the saved state of a module.
     * @param moduleId The ID of the module.
     * @param defaultState The default state if not found.
     * @returns The saved state of the module.
     */
    public getModuleState(moduleId: string, defaultState: boolean): boolean {
        let state: boolean;

        if (!this._cache.has(moduleId)) {
            state = this._storage.load<boolean>(moduleId, defaultState);
            this._cache.set(moduleId, state);
        } else {
            state = this._cache.get(moduleId)!;
        }

        return state;
    }

    /**
     * Saves the state of a module.
     * @param moduleId The ID of the module.
     * @param state The state to save.
     */
    public setModuleState(moduleId: string, state: boolean): void {
        this._cache.set(moduleId, state);
        this._storage.save(moduleId, state);
        this._logger.info(`Module '${moduleId}' saved as: ${state}`);
    }
}
