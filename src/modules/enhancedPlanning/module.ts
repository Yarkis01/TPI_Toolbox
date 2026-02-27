import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { PLANNING_SELECTORS } from './constants';
import { QuickNavigationFeature } from './features/QuickNavigationFeature';
import { ShowAllPlanningsFeature } from './features/ShowAllPlanningsFeature';
import { FeatureRegistry } from './registry/FeatureRegistry';

/** Configuration keys mapping feature IDs to their config toggle key. */
const CONFIG_KEYS = {
    QUICK_NAVIGATION: 'enableQuickNavigation',
    SHOW_ALL_PLANNINGS: 'enableShowAllPlannings',
} as const;

/**
 * EnhancedPlanningModule
 * Modular module that improves the employee planning page.
 * Uses a FeatureRegistry to manage independent sub-features.
 * Each feature can be toggled individually via the module configuration.
 */
export class EnhancedPlanningModule extends BaseModule {
    private readonly _featureRegistry: FeatureRegistry = new FeatureRegistry();
    private _featuresRegistered: boolean = false;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'enhanced_planning';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Planning Amélioré';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Améliore la page de gestion des plannings avec des fonctionnalités modulaires.';
    }

    /**
     * @inheritdoc
     */
    public getConfigSchema(): IModuleConfigSchema {
        return {
            options: [
                {
                    key: CONFIG_KEYS.QUICK_NAVIGATION,
                    label: 'Navigation rapide',
                    description:
                        'Ajoute des flèches ◄ ► pour naviguer entre les sous-plannings.',
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: CONFIG_KEYS.SHOW_ALL_PLANNINGS,
                    label: 'Afficher tous les plannings',
                    description:
                        'Ajoute un bouton pour afficher tous les plannings du type sélectionné en une seule vue.',
                    type: 'boolean',
                    defaultValue: true,
                },
            ],
        };
    }

    /**
     * @inheritdoc
     */
    protected onConfigChanged(key: string, value: string | number | boolean): void {
        super.onConfigChanged(key, value);

        if (!this._isTargetPage()) return;

        if (key === CONFIG_KEYS.QUICK_NAVIGATION) {
            this._featureRegistry.toggleFeature('quick_navigation', value as boolean);
        } else if (key === CONFIG_KEYS.SHOW_ALL_PLANNINGS) {
            this._featureRegistry.toggleFeature('show_all_plannings', value as boolean);
        }
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!this._isTargetPage()) {
            this._logger.info('Not on planning page, skipping.');
            return;
        }

        this._registerFeatures();
        this._enableFeaturesFromConfig();

        this._logger.info('Enhanced Planning module enabled.');
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._featureRegistry.disableAll();
        this._logger.info('Enhanced Planning module disabled.');
    }

    /**
     * Checks if the current page is the planning page.
     */
    private _isTargetPage(): boolean {
        return document.location.href.includes(PLANNING_SELECTORS.PAGE_MATCH);
    }

    /**
     * Registers all available features into the registry.
     * Only registers once even if called multiple times.
     */
    private _registerFeatures(): void {
        if (this._featuresRegistered) return;

        this._featureRegistry.register(new QuickNavigationFeature());
        this._featureRegistry.register(new ShowAllPlanningsFeature());
        this._featuresRegistered = true;
    }

    /**
     * Enables features based on current configuration values.
     */
    private _enableFeaturesFromConfig(): void {
        const quickNavEnabled = this.getConfigValue<boolean>(
            CONFIG_KEYS.QUICK_NAVIGATION,
            true,
        );
        this._featureRegistry.toggleFeature('quick_navigation', quickNavEnabled);

        const showAllEnabled = this.getConfigValue<boolean>(
            CONFIG_KEYS.SHOW_ALL_PLANNINGS,
            true,
        );
        this._featureRegistry.toggleFeature('show_all_plannings', showAllEnabled);
    }
}

