import { CONFIG } from '../../core/Config';
import { UpdateChecker } from '../../core/update/UpdateChecker';
import { StorageService } from '../../services/StorageService';
import { LocalVersionSource } from '../../services/update/LocalVersionSource';
import { RemoteVersionSource } from '../../services/update/RemoteVersionSource';
import { UpdateStateRepository } from '../../services/update/UpdateStateRepository';
import { Logger } from '../../utils/Logger';
import { IComponent } from '../interfaces/IComponent';
import { SlideInToastUpdateNotifier } from '../notifications/SlideInToastUpdateNotifier';

/**
 * UI Component that checks updates and displays a toast when a new version is available.
 * This is the composition root for update-check dependencies.
 */
export class UpdateNotification implements IComponent {
    private readonly _logger: Logger;

    public constructor() {
        this._logger = new Logger('UpdateNotification');
    }

    public inject(): void {
        // Intentionally fire-and-forget (UI injection contract is synchronous).
        void this._run();
    }

    private async _run(): Promise<void> {
        try {
            const checker = new UpdateChecker({
                localVersionSource: new LocalVersionSource(),
                remoteVersionSource: new RemoteVersionSource(),
                stateRepository: new UpdateStateRepository(new StorageService()),
                notifier: new SlideInToastUpdateNotifier(),
                checkIntervalMs: CONFIG.UPDATE_CHECK_INTERVAL_MS,
            });

            await checker.checkAndNotify();
        } catch (error) {
            this._logger.debug(`Update notification skipped: ${(error as Error).message}`);
        }
    }
}
