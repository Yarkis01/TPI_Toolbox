/**
 * Interface for application modules.
 */
export default interface IModule {
    /**
     * Module unique identifier.
     */
    get id(): string;

    /**
     * Module name.
     */
    get name(): string;

    /**
     * Module description.
     */
    get description(): string;

    /**
     * Initializes the module.
     */
    init(): void;

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
     * @return True if the module is enabled, false otherwise.
     */
    isEnabled(): boolean;
}
