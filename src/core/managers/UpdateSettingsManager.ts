import { UPDATE_CONFIG } from '../../config/UpdateConfig';
import { StorageService } from '../../services/StorageService';

/**
 * UpdateSettingsManager handles user preferences related to update checks.
 *
 * Persistence is handled via StorageService (localStorage) to survive page reloads.
 */
export class UpdateSettingsManager {
    private readonly _storage: StorageService;

    /**
     * Creates a new UpdateSettingsManager.
     * @param storage Storage implementation (injectable for testability).
     */
    public constructor(storage: StorageService = new StorageService()) {
        this._storage = storage;
    }

    /**
     * Returns whether update checks are enabled.
     * Default: true.
     */
    public isUpdateCheckEnabled(): boolean {
        return this._storage.load<boolean>(UPDATE_CONFIG.UPDATE_CHECK_ENABLED_STORAGE_KEY, true);
    }

    /**
     * Enables/disables update checks.
     * @param enabled New state.
     */
    public setUpdateCheckEnabled(enabled: boolean): void {
        this._storage.save<boolean>(UPDATE_CONFIG.UPDATE_CHECK_ENABLED_STORAGE_KEY, enabled);
    }
}
