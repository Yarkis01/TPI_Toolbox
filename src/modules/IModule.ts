/**
 * Interface representing a module in the application.
 */
export interface IModule {
    /**
     * Gets the unique identifier of the module.
     */
    get id(): string;

    /**
     * Gets the name of the module.
     */
    get name(): string;

    /**
     * Gets the description of the module.
     */
    get description(): string | undefined;

    /**
     * Initializes the module.
     */
    initialize(): void;

    /**
     * Enables the module.
     */
    enable(): void;

    /**
     * Disables the module.
     */
    disable(): void;

    /**
     * Checks if the module is enabled.
     * @return true if the module is enabled, false otherwise.
     */
    isEnabled(): boolean;
}