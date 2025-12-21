import { ChatOverlay } from '../../ui/components/ChatOverlay';
import { HeaderWidgets } from '../../ui/components/HeaderWidgets';
import { SettingsModal } from '../../ui/components/SettingsModal';
import { UpdateNotification } from '../../ui/components/UpdateNotification';
import { IComponent } from '../../ui/interfaces/IComponent';
import { Logger } from '../../utils/Logger';
import { SettingsManager } from '../settings/SettingsManager';

/**
 * Factory type for creating components.
 */
type ComponentFactory = (settingsManager: SettingsManager) => IComponent;

/**
 * Entry in the component registry.
 */
interface ComponentEntry {
    key: string | null;
    create: ComponentFactory;
}

/**
 * Loader for components based on settings.
 */
export class ComponentsLoader {
    private readonly _logger: Logger;
    private readonly _settingsManager: SettingsManager;

    /**
     * Registry of all available modifiers.
     */
    private readonly _registry: ComponentEntry[] = [
        { key: null, create: () => new HeaderWidgets() },
        { key: null, create: () => new ChatOverlay() },
        { key: null, create: () => new UpdateNotification() },
        { key: null, create: (settingsManager) => new SettingsModal(settingsManager) },
    ];

    /**
     * Creates an instance of the ComponentLoader class.
     * @param settingsManager The settings manager instance.
     */
    public constructor(settingsManager: SettingsManager) {
        this._logger = new Logger('ComponentLoader');
        this._settingsManager = settingsManager;
    }

    /**
     * Loads and instantiates the active components based on settings.
     * @returns An array of active IComponent instances.
     */
    public loadComponents(): IComponent[] {
        const activeComponents: IComponent[] = [];

        this._registry.forEach((entry) => {
            if (entry.key === null || this._settingsManager.isEnabled(entry.key)) {
                try {
                    const instance = entry.create(this._settingsManager);
                    activeComponents.push(instance);
                } catch (error) {
                    this._logger.error(`Failed to load component: ${entry.create.name}`);
                }
            }
        });

        this._logger.info(`Loaded ${activeComponents.length} components.`);

        return activeComponents;
    }
}
