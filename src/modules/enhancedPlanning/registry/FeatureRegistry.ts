import { Logger } from '../../../utils/Logger';
import IFeature from '../interfaces/IFeature';

/**
 * Registry to manage planning features.
 * Handles registration, activation, and deactivation of all features.
 */
export class FeatureRegistry {
    private readonly _features: Map<string, IFeature> = new Map();
    private readonly _logger: Logger = new Logger('FeatureRegistry');

    /**
     * Registers a feature in the registry.
     * @param feature - The feature to register.
     */
    public register(feature: IFeature): void {
        if (this._features.has(feature.id)) {
            this._logger.warn(`Feature '${feature.id}' is already registered.`);
            return;
        }

        this._features.set(feature.id, feature);
        this._logger.info(`Feature registered: ${feature.name} (${feature.id})`);
    }

    /**
     * Enables all registered features that are marked as enabled by default.
     */
    public enableAll(): void {
        for (const feature of this._features.values()) {
            if (feature.enabledByDefault) {
                feature.enable();
            }
        }
    }

    /**
     * Disables all currently active features.
     */
    public disableAll(): void {
        for (const feature of this._features.values()) {
            if (feature.isEnabled()) {
                feature.disable();
            }
        }
    }

    /**
     * Toggles a specific feature by its ID.
     * @param featureId - The feature identifier.
     * @param enable - Whether to enable or disable the feature.
     */
    public toggleFeature(featureId: string, enable: boolean): void {
        const feature = this._features.get(featureId);
        if (!feature) {
            this._logger.warn(`Feature '${featureId}' not found.`);
            return;
        }

        if (enable && !feature.isEnabled()) {
            feature.enable();
        } else if (!enable && feature.isEnabled()) {
            feature.disable();
        }
    }

    /**
     * Gets all registered features, sorted by name.
     * @returns An array of registered features.
     */
    public getFeatures(): IFeature[] {
        return Array.from(this._features.values()).toSorted((a, b) =>
            a.name.localeCompare(b.name),
        );
    }
}
