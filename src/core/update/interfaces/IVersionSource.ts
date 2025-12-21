/**
 * Abstraction used to retrieve a version string (e.g. "0.1.0").
 * Allows the update-checking logic to remain independent from storage/network concerns.
 */
export interface IVersionSource {
    getVersion(): Promise<string>;
}
