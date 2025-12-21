import { Logger } from '../../utils/Logger';
import { Semver } from './Semver';
import { IUpdateNotifier } from './interfaces/IUpdateNotifier';
import { IUpdateStateRepository } from './interfaces/IUpdateStateRepository';
import { IVersionSource } from './interfaces/IVersionSource';

/**
 * Orchestrates the update-checking flow:
 * - retrieves local and remote versions
 * - handles cooldown/caching via repository
 * - triggers a user notification when needed
 */
export class UpdateChecker {
    private readonly _logger: Logger;
    private readonly _localVersionSource: IVersionSource;
    private readonly _remoteVersionSource: IVersionSource;
    private readonly _stateRepository: IUpdateStateRepository;
    private readonly _notifier: IUpdateNotifier;
    private readonly _checkIntervalMs: number;

    public constructor(params: {
        localVersionSource: IVersionSource;
        remoteVersionSource: IVersionSource;
        stateRepository: IUpdateStateRepository;
        notifier: IUpdateNotifier;
        checkIntervalMs: number;
    }) {
        this._logger = new Logger('UpdateChecker');

        this._localVersionSource = params.localVersionSource;
        this._remoteVersionSource = params.remoteVersionSource;
        this._stateRepository = params.stateRepository;
        this._notifier = params.notifier;
        this._checkIntervalMs = params.checkIntervalMs;
    }

    public async checkAndNotify(): Promise<void> {
        try {
            const localVersion = await this._localVersionSource.getVersion();
            const state = this._stateRepository.load();

            const now = Date.now();
            let remoteVersion: string | null = state.lastKnownRemoteVersion;

            const shouldFetch =
                !remoteVersion ||
                !state.lastCheckedAt ||
                now - state.lastCheckedAt > this._checkIntervalMs;

            if (shouldFetch) {
                this._logger.debug('Checking remote version...');
                remoteVersion = await this._remoteVersionSource.getVersion();

                this._stateRepository.save({
                    ...state,
                    lastCheckedAt: now,
                    lastKnownRemoteVersion: remoteVersion,
                });
            } else {
                this._logger.debug('Skipping remote version fetch (cooldown/cache).');
            }

            if (!remoteVersion) return;

            const isDifferent = remoteVersion !== localVersion;

            if (!isDifferent) return;
            const isRemoteNewer = Semver.compare(remoteVersion, localVersion) > 0;

            this._notifier.notify({ localVersion, remoteVersion, isRemoteNewer });

            this._stateRepository.save({
                ...this._stateRepository.load(),
                lastNotifiedRemoteVersion: remoteVersion,
            });
        } catch (error) {
            this._logger.warn(`Update check failed: ${(error as Error).message}`);
        }
    }
}
