/**
 * Abstraction for retrieving the latest available toolbox version.
 */
export default interface IVersionProvider {
    /**
     * Returns the latest available version string (e.g. "0.1.0") or null if unavailable.
     */
    getLatestVersion(): Promise<string | null>;
}
