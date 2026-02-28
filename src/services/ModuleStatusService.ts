import { APP_INFORMATIONS } from '../core/constants/AppConstants';
import { Logger } from '../utils/Logger';

export interface ModuleStatusData {
    name: string;
    status: 'ok' | 'broken' | 'fix' | 'bug' | 'unknown';
    reason: string | null;
    broken_since: string | null;
    fixed_in_version?: string | null;
}

export interface EffectiveModuleStatus extends ModuleStatusData {
    effectiveStatus: 'ok' | 'broken' | 'update_required' | 'bug' | 'unknown';
}

export interface ModuleStatusResponse {
    generated_at: string;
    modules: Record<string, ModuleStatusData>;
}

/**
 * Service to fetch and store module statuses from the API.
 */
export class ModuleStatusService {
    private static _instance: ModuleStatusService | null = null;
    private readonly _logger: Logger;
    private _statusData: Record<string, ModuleStatusData> | null = null;
    private _isLoaded: boolean = false;

    private constructor() {
        this._logger = new Logger('ModuleStatusService');
    }

    /**
     * Gets the singleton instance of ModuleStatusService.
     */
    public static getInstance(): ModuleStatusService {
        if (!ModuleStatusService._instance) {
            ModuleStatusService._instance = new ModuleStatusService();
        }
        return ModuleStatusService._instance;
    }

    /**
     * Fetches module statuses from the remote API.
     */
    public async fetchStatus(): Promise<void> {
        if (!navigator.onLine) {
            this._logger.info('Device is offline. Skipping module status override.');
            return;
        }

        try {
            const response = await fetch('https://tpitoolbox.yarkis.top/api/modules/status');

            if (response.status === 503) {
                this._logger.info('API returned 503. Skipping module status override.');
                return;
            }

            if (!response.ok) {
                this._logger.warn(`API returned ${response.status}. Skipping module status override.`);
                return;
            }

            const data = await response.json() as ModuleStatusResponse;
            this._statusData = data.modules;
            this._isLoaded = true;
            this._logger.info('Module status data successfully fetched.');
        } catch (error) {
            this._logger.error(`Error fetching module status: ${error}`);
        }
    }

    /**
     * Retrieves the effective status for a given module, taking version into account.
     * @param moduleId The ID of the module to check.
     */
    public getStatus(moduleId: string): EffectiveModuleStatus {
        let rawStatus: ModuleStatusData;

        if (!this._isLoaded || !this._statusData || !this._statusData[moduleId]) {
            rawStatus = {
                name: moduleId,
                status: 'unknown',
                reason: null,
                broken_since: null
            };
        } else {
            rawStatus = this._statusData[moduleId];
        }

        let effectiveStatus: 'ok' | 'broken' | 'update_required' | 'bug' | 'unknown' = rawStatus.status as any;

        if (rawStatus.status === 'fix') {
            if (rawStatus.fixed_in_version && this.compareVersions(APP_INFORMATIONS.APP_VERSION, rawStatus.fixed_in_version) >= 0) {
                effectiveStatus = 'ok';
            } else {
                effectiveStatus = 'update_required';
            }
        } else if (rawStatus.status === 'ok') {
            if (rawStatus.fixed_in_version && this.compareVersions(APP_INFORMATIONS.APP_VERSION, rawStatus.fixed_in_version) < 0) {
                effectiveStatus = 'update_required';
            }
        }

        return {
            ...rawStatus,
            effectiveStatus
        };
    }

    /**
     * Compare two semantic versions.
     * @returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if v1 == v2
     */
    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const len = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < len; i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }
}
