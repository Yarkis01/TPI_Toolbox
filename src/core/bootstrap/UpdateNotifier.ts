import { UPDATE_CONFIG } from '../../config/UpdateConfig';
import { StorageService } from '../../services/StorageService';
import { GitHubVersionProvider } from '../../services/GitHubVersionProvider';
import { VersionUtils } from '../../utils/VersionUtils';
import { Logger } from '../../utils/Logger';
import { APP_INFORMATIONS } from '../constants/AppConstants';
import IBootstrap from '../interfaces/IBootstrap';
import IVersionProvider from '../interfaces/IVersionProvider';
import { UpdateToast } from './UpdateToast';
import './styles/_updateToast.scss';

/**
 * Bootstrap responsible for checking for updates and displaying a toast when a new version is available.
 */
export class UpdateNotifier implements IBootstrap {
    private readonly _logger: Logger;
    private readonly _storage: StorageService;
    private readonly _versionProvider: IVersionProvider;
    private readonly _toast: UpdateToast;

    /**
     * Creates a new UpdateNotifier.
     * Dependencies are injectable to keep this class unit-testable and aligned with SOLID.
     */
    public constructor(
        versionProvider?: IVersionProvider,
        storage: StorageService = new StorageService(),
        toast: UpdateToast = new UpdateToast(),
    ) {
        this._logger = new Logger('UpdateNotifier');
        this._storage = storage;
        this._toast = toast;

        // Allow overriding the remote version URL locally (useful for private repositories).
        const remoteUrl = this._storage.load<string>(
            UPDATE_CONFIG.REMOTE_VERSION_URL_STORAGE_KEY,
            UPDATE_CONFIG.REMOTE_VERSION_URL,
        );

        this._versionProvider =
            versionProvider ?? new GitHubVersionProvider(remoteUrl, UPDATE_CONFIG.FETCH_TIMEOUT_MS);
    }

    /**
     * @inheritdoc
     */
    public run(): void {
        // Fire-and-forget (no blocking).
        void this._checkAndNotify();
    }

    private async _checkAndNotify(): Promise<void> {
        const current = APP_INFORMATIONS.APP_VERSION;

        const latest = await this._versionProvider.getLatestVersion();
        if (!latest) return;

        if (VersionUtils.compare(latest, current) <= 0) {
            this._logger.debug(`No update available (current=${current}, latest=${latest}).`);
            return;
        }

        const dismissed = this._storage.load<string>(
            UPDATE_CONFIG.DISMISSED_VERSION_STORAGE_KEY,
            '',
        );

        if (dismissed === latest) {
            this._logger.debug(`Update ${latest} dismissed previously; toast suppressed.`);
            return;
        }

        this._logger.info(`Update available: current=${current}, latest=${latest}`);

        this._toast.show({
            latestVersion: latest,
            onDismiss: () => this._storage.save(UPDATE_CONFIG.DISMISSED_VERSION_STORAGE_KEY, latest),
            onOpenGitHub: () => {
                window.open(UPDATE_CONFIG.GITHUB_URL, '_blank', 'noopener,noreferrer');
            },
        });
    }
}
