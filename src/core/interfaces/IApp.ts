/**
 * Interface representing the main application.
 */
export default interface IApp {
    /**
     * Starts the application.
     * @returns A promise that resolves when the application has started.
     */
    start(): Promise<void>;
}
