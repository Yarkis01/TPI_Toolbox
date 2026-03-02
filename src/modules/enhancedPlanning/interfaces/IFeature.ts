/**
 * Interface for a planning sub-feature.
 * Each feature is a self-contained enhancement that can be enabled/disabled independently.
 */
export default interface IFeature {
    /**
     * Unique identifier for this feature.
     */
    get id(): string;

    /**
     * Display name for this feature.
     */
    get name(): string;

    /**
     * Description of what this feature does.
     */
    get description(): string;

    /**
     * Whether this feature should be enabled by default.
     */
    get enabledByDefault(): boolean;

    /**
     * Enables this feature and applies its enhancements to the DOM.
     */
    enable(): void;

    /**
     * Disables this feature and reverts its DOM changes.
     */
    disable(): void;

    /**
     * Checks if this feature is currently enabled.
     * @returns True if the feature is active.
     */
    isEnabled(): boolean;
}
