import { APP_INFORMATIONS } from '../core/constants/AppConstants';
import { Logger } from '../utils/Logger';
import { StorageService } from './StorageService';

export interface ModuleStatusData {
    name: string;
    status: 'ok' | 'broken' | 'fix' | 'bug' | 'deprecated' | 'unknown';
    reason: string | null;
    broken_since: string | null;
    fixed_in_version?: string | null;
    github_issue_url?: string | null;
    removal_version?: string | null;
    is_archived?: boolean;
    is_update_planned?: boolean;
    planned_update_version?: string | null;
}

export interface EffectiveModuleStatus extends ModuleStatusData {
    effectiveStatus: 'ok' | 'broken' | 'update_required' | 'bug' | 'deprecated' | 'unknown';
}

export interface ModuleStatusResponse {
    generated_at: string;
    modules: Record<string, ModuleStatusData>;
}

interface ModuleStatusCache {
    ts: number;
    modules: Record<string, ModuleStatusData>;
}

const CACHE_KEY = 'module_status_cache';
const CACHE_TTL = 5 * 60 * 1000;

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
     * Loads module statuses from cache instantly, then refreshes in background if cache is stale.
     */
    public fetchStatus(): void {
        this._loadFromCache();
        this._refreshInBackground();
    }

    /**
     * Loads module statuses from the local cache (synchronous, instantaneous).
     */
    private _loadFromCache(): void {
        const cached = StorageService.getInstance().load<ModuleStatusCache | null>(CACHE_KEY, null);

        if (!cached) {
            this._logger.info('No cache found, modules will start as unknown.');
            return;
        }

        this._statusData = cached.modules;
        this._isLoaded = true;
        this._logger.info('Module status loaded from cache.');
    }

    /**
     * Refreshes module statuses from the remote API in the background.
     * Skipped if the cache is still fresh (within TTL).
     */
    private async _refreshInBackground(): Promise<void> {
        if (!navigator.onLine) {
            this._logger.info('Device is offline. Skipping module status refresh.');
            return;
        }

        const cached = StorageService.getInstance().load<ModuleStatusCache | null>(CACHE_KEY, null);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            this._logger.info('Cache is fresh, skipping API refresh.');
            return;
        }

        try {
            const response = await fetch('https://tpitoolbox.yarkis.top/api/modules/status');

            if (response.status === 503) {
                this._logger.info('API returned 503. Skipping module status refresh.');
                return;
            }

            if (!response.ok) {
                this._logger.warn(
                    `API returned ${response.status}. Skipping module status refresh.`,
                );
                return;
            }

            const data = (await response.json()) as ModuleStatusResponse;
            this._statusData = data.modules;
            this._isLoaded = true;

            StorageService.getInstance().save<ModuleStatusCache>(CACHE_KEY, {
                ts: Date.now(),
                modules: data.modules,
            });

            this._logger.info('Module status refreshed and cached.');
        } catch (error) {
            this._logger.error(`Error refreshing module status: ${error}`);
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
                broken_since: null,
                is_archived: false,
                is_update_planned: false,
            };
        } else {
            rawStatus = this._statusData[moduleId];
        }

        let effectiveStatus:
            | 'ok'
            | 'broken'
            | 'update_required'
            | 'bug'
            | 'deprecated'
            | 'unknown' = rawStatus.status as any;

        if (rawStatus.status === 'fix') {
            if (
                rawStatus.fixed_in_version &&
                this._compareVersions(APP_INFORMATIONS.APP_VERSION, rawStatus.fixed_in_version) >= 0
            ) {
                effectiveStatus = 'ok';
            } else {
                effectiveStatus = 'update_required';
            }
        } else if (rawStatus.status === 'ok') {
            if (
                rawStatus.fixed_in_version &&
                this._compareVersions(APP_INFORMATIONS.APP_VERSION, rawStatus.fixed_in_version) < 0
            ) {
                effectiveStatus = 'update_required';
            }
        }

        let isUpdatePlanned = rawStatus.is_update_planned;
        if (isUpdatePlanned && rawStatus.planned_update_version) {
            if (
                this._compareVersions(
                    APP_INFORMATIONS.APP_VERSION,
                    rawStatus.planned_update_version,
                ) >= 0
            ) {
                isUpdatePlanned = false;
            }
        }

        return {
            ...rawStatus,
            effectiveStatus,
            is_update_planned: isUpdatePlanned,
        };
    }

    /**
     * Compares two semantic versions.
     * @returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal
     */
    private _compareVersions(v1: string, v2: string): number {
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
