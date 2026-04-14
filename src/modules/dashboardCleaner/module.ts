import { BaseModule } from '../../core/abstract/BaseModule';
import { DASHBOARD_CLEANER_SELECTORS } from './constants';
import './styles.scss';

/**
 * Module to clean up the dashboard visual interface.
 */
export class DashboardCleanerModule extends BaseModule {
    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'dashboard_cleaner';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Dashboard Allégé';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Masque les éléments superflus du tableau de bord (intro, publicités, raccourcis sociaux) et optimise l'affichage du fil d'actions.";
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        document.body.classList.add(DASHBOARD_CLEANER_SELECTORS.ENABLED_CLASS);
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        document.body.classList.remove(DASHBOARD_CLEANER_SELECTORS.ENABLED_CLASS);
    }
}
