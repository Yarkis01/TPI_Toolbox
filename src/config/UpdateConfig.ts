/**
 * Update checker configuration.
 */
export const UPDATE_CONFIG = {
    /**
     * Remote URL hosting the latest available toolbox version.
     *
     * IMPORTANT: do not include any temporary "token" query parameter.
     */
    REMOTE_VERSION_URL:
        'https://raw.githubusercontent.com/Yarkis01/TPI_Toolbox/refs/heads/main/src/config/versions.json?token=GHSAT0AAAAAADRW4AJPLZU22JPNAMYLMWJU2KJ2ECA',

    /**
     * GitHub page opened by the update toast action.
     */
    GITHUB_URL: 'https://github.com/Yarkis01/TPI_Toolbox',

    /**
     * Storage key used to remember the last dismissed update version.
     */
    DISMISSED_VERSION_STORAGE_KEY: 'update:dismissedVersion',

    /**
     * Network timeout used when fetching the remote version.
     */
    FETCH_TIMEOUT_MS: 8000,
} as const;
