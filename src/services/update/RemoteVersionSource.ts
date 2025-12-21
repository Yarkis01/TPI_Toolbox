import { CONFIG } from '../../core/Config';
import { IVersionSource } from '../../core/update/interfaces/IVersionSource';
import { Logger } from '../../utils/Logger';

interface RemoteVersionManifest {
    plugginVersion: string;
}

/**
 * Reads the remote version from a JSON file hosted on GitHub.
 * Expected shape:
 * {
 *   "plugginVersion": "0.1.0"
 * }
 */
export class RemoteVersionSource implements IVersionSource {
    private readonly _logger: Logger;

    public constructor() {
        this._logger = new Logger('RemoteVersionSource');
    }

    public async getVersion(): Promise<string> {
        const res = await fetch(CONFIG.REMOTE_VERSION_URL, {
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} while fetching remote version`);
        }

        const data = (await res.json()) as Partial<RemoteVersionManifest>;

        const remoteVersion = data.plugginVersion;
        if (!remoteVersion || typeof remoteVersion !== 'string') {
            this._logger.warn('Remote manifest is missing "plugginVersion".');
            throw new Error('Invalid remote version manifest');
        }

        return remoteVersion.trim();
    }
}
