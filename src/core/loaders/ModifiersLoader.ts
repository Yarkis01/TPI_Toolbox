import { IModifier } from '../../ui/interfaces/IModifier';
import { BodyModifier } from '../../ui/modifiers/BodyModifier';
import { EntityStatusColorizerModifier } from '../../ui/modifiers/EntityStatusColorizerModifier';
import { LayoutCleaner } from '../../ui/modifiers/LayoutCleaner';
import { RideHypeAsTextModifier } from '../../ui/modifiers/RideHypeAsTextModifier';
import { Logger } from '../../utils/Logger';
import { SettingsManager } from '../settings/SettingsManager';

/**
 * Constructor type for a modifier.
 */
type ModifierConstructor = new () => IModifier;

/**
 * Entry in the modifier registry.
 */
interface ModifierEntry {
    key: string | null;
    Class: ModifierConstructor;
}

/**
 * Loader for modifiers based on settings.
 */
export class ModifiersLoader {
    private readonly _logger: Logger;
    private readonly _settingsManager: SettingsManager;

    /**
     * Registry of all available modifiers.
     */
    private readonly _registry: ModifierEntry[] = [
        { key: null, Class: LayoutCleaner },
        { key: null, Class: BodyModifier },

        { key: 'showRideHypeAsText', Class: RideHypeAsTextModifier },
        { key: 'entityStatusColorizer', Class: EntityStatusColorizerModifier },
    ];

    /**
     * Creates an instance of the ModifierLoader class.
     * @param settingsManager The settings manager instance.
     */
    public constructor(settingsManager: SettingsManager) {
        this._logger = new Logger('ModifierLoader');
        this._settingsManager = settingsManager;
    }

    /**
     * Loads and instantiates the active modifiers based on settings.
     * @returns An array of active IModifier instances.
     */
    public loadModifiers(): IModifier[] {
        const activeModifiers: IModifier[] = [];

        this._registry.forEach((entry) => {
            if (entry.key === null || this._settingsManager.isEnabled(entry.key)) {
                try {
                    const instance = new entry.Class();
                    activeModifiers.push(instance);
                } catch (error) {
                    this._logger.error(`Failed to load modifier: ${entry.Class.name}`);
                }
            }
        });

        this._logger.info(`Loaded ${activeModifiers.length} modifiers.`);

        return activeModifiers;
    }
}
