import IVersionProvider from '../core/interfaces/IVersionProvider';
import { Logger } from '../utils/Logger';

type RemoteVersions = {
    plugginVersion?: unknown;
    pluginVersion?: unknown;
};

/**
 * Retrieves the latest available version from a raw GitHub JSON file.
 */
export class GitHubVersionProvider implements IVersionProvider {
    private readonly _logger: Logger;
    private readonly _url: string;
    private readonly _timeoutMs: number;

    /**
     * @param url Remote versions JSON URL.
     * @param timeoutMs Network timeout in milliseconds.
     */
    public constructor(url: string, timeoutMs: number) {
        this._logger = new Logger('GitHubVersionProvider');
        this._url = url;
        this._timeoutMs = timeoutMs;
    }

    /**
     * @inheritdoc
     */
    public async getLatestVersion(): Promise<string | null> {
        try {
            // Avoid cache issues by appending a small cache buster.
            const url = `${this._url}${this._url.includes('?') ? '&' : '?'}_=${Date.now()}`;

            const rawText = await this._getText(url);
            if (rawText === null) return null;

            const parsed = this._parseLooseJson(rawText);

            const v = (parsed.plugginVersion ?? parsed.pluginVersion) as unknown;
            if (typeof v !== 'string' || v.trim().length === 0) {
                this._logger.warn('Remote versions.json did not contain a valid version string.');
                return null;
            }

            return v.trim();
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this._logger.warn(`Remote version fetch failed: ${msg}`);
            return null;
        }
    }

    /**
     * Retrieves the remote file as text.
     * Uses GM_xmlhttpRequest when available (better resilience against CSP/CORS),
     * otherwise falls back to window.fetch.
     */
    private async _getText(url: string): Promise<string | null> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gmRequest = (globalThis as any).GM_xmlhttpRequest as
            | (undefined | ((details: any) => void));

        if (typeof gmRequest === 'function') {
            return await this._getTextViaGM(gmRequest, url);
        }

        return await this._getTextViaFetch(url);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _getTextViaGM(gmRequest: (details: any) => void, url: string): Promise<string | null> {
        return new Promise((resolve) => {
            try {
                gmRequest({
                    method: 'GET',
                    url,
                    timeout: this._timeoutMs,
                    onload: (res: { status?: number; responseText?: string }) => {
                        const status = typeof res.status === 'number' ? res.status : 0;
                        if (status < 200 || status >= 300) {
                            this._logger.warn(`Remote version fetch failed (HTTP ${status}).`);
                            resolve(null);
                            return;
                        }
                        resolve(res.responseText ?? '');
                    },
                    ontimeout: () => {
                        this._logger.warn('Remote version fetch failed: timeout.');
                        resolve(null);
                    },
                    onerror: () => {
                        this._logger.warn('Remote version fetch failed: network error.');
                        resolve(null);
                    },
                });
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this._logger.warn(`Remote version fetch failed: ${msg}`);
                resolve(null);
            }
        });
    }

    private async _getTextViaFetch(url: string): Promise<string | null> {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), this._timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
            });

            if (!response.ok) {
                this._logger.warn(`Remote version fetch failed (HTTP ${response.status}).`);
                return null;
            }

            return await response.text();
        } finally {
            window.clearTimeout(timeout);
        }
    }

    /**
     * Parses JSON while being tolerant to single quotes (common copy/paste mistake).
     */
    private _parseLooseJson(rawText: string): RemoteVersions {
        try {
            return JSON.parse(rawText) as RemoteVersions;
        } catch {
            // Best-effort conversion of '...' tokens to "...".
            const normalized = rawText.replace(/'([^']*)'/g, '"$1"');
            try {
                return JSON.parse(normalized) as RemoteVersions;
            } catch {
                this._logger.warn('Failed to parse remote versions.json.');
                return {};
            }
        }
    }
}
