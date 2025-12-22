/**
 * Update checker configuration.
 */
export const UPDATE_CONFIG = {
    /**
     * Default remote URL hosting the latest available toolbox version.
     *
     * Notes:
     * - If the repository/file is public, the canonical raw URL format is:
     *   https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
     * - If the repository/file is private, a tokenized URL can be configured locally via
     *   REMOTE_VERSION_URL_STORAGE_KEY (see below) so you don't hardcode secrets in the codebase.
     */
    REMOTE_VERSION_URL:
        'https://raw.githubusercontent.com/Yarkis01/TPI_Toolbox/refs/heads/main/src/config/versions.json?token=GHSAT0AAAAAADRW4AJPWEEL3FWIKUBQOGW62KJ3LMQ',

    /**
     * localStorage key (through StorageService) that can override REMOTE_VERSION_URL.
     *
     * Example usage in the browser console (run once):
     *   localStorage.setItem('tpitoolbox:update:remoteVersionUrl', JSON.stringify('https://raw.../versions.json?token=...'))
     */
    REMOTE_VERSION_URL_STORAGE_KEY: 'update:remoteVersionUrl',

    /**
     * GitHub page opened by the update toast action.
     */
    GITHUB_URL: 'https://github.com/Yarkis01/TPI_Toolbox',

    /**
     * Storage key used to remember the last dismissed update version.
     */
    DISMISSED_VERSION_STORAGE_KEY: 'update:dismissedVersion',

    /**
     * Storage key used to enable/disable update checks.
     *
     * Default: enabled.
     */
    UPDATE_CHECK_ENABLED_STORAGE_KEY: 'update:checkEnabled',

    /**
     * Network timeout used when fetching the remote version.
     */
    FETCH_TIMEOUT_MS: 8000,
} as const;
