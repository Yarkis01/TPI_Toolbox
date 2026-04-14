import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { CONFIG_KEYS, DASHBOARD_CLEANER_SELECTORS, DASHBOARD_PAGE_MATCH } from './constants';
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
        return "Masque les éléments superflus du tableau de bord et optimise l'affichage du fil d'actions.";
    }

    /**
     * @inheritdoc
     */
    public getConfigSchema(): IModuleConfigSchema {
        return {
            options: [
                {
                    key: CONFIG_KEYS.HIDE_INTRO,
                    label: "Masquer l'introduction",
                    description: "Masque l'animation d'introduction du tableau de bord.",
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: CONFIG_KEYS.HIDE_SOCIAL_SHORTCUTS,
                    label: 'Masquer les raccourcis sociaux',
                    description: 'Masque la barre de raccourcis vers les réseaux sociaux.',
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: CONFIG_KEYS.ACTIONS_FEED_HEIGHT,
                    label: "Hauteur du fil d'actions (px)",
                    description: "Définit la hauteur maximale du fil d'actions en pixels.",
                    type: 'number',
                    defaultValue: 490,
                    min: 200,
                    max: 1200,
                    step: 10,
                },
            ],
        };
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!this._isTargetPage()) return;

        document.body.classList.add(DASHBOARD_CLEANER_SELECTORS.ENABLED_CLASS);
        this._applyConfig();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        document.body.classList.remove(DASHBOARD_CLEANER_SELECTORS.ENABLED_CLASS);
        document.body.classList.remove(DASHBOARD_CLEANER_SELECTORS.HIDE_INTRO_CLASS);
        document.body.classList.remove(DASHBOARD_CLEANER_SELECTORS.HIDE_SHORTCUTS_CLASS);
        this._setFeedHeight(null);
    }

    /**
     * @inheritdoc
     */
    protected onConfigChanged(key: string, value: string | number | boolean): void {
        super.onConfigChanged(key, value);

        if (!this._isTargetPage()) return;

        if (key === CONFIG_KEYS.HIDE_INTRO) {
            document.body.classList.toggle(
                DASHBOARD_CLEANER_SELECTORS.HIDE_INTRO_CLASS,
                value as boolean,
            );
        } else if (key === CONFIG_KEYS.HIDE_SOCIAL_SHORTCUTS) {
            document.body.classList.toggle(
                DASHBOARD_CLEANER_SELECTORS.HIDE_SHORTCUTS_CLASS,
                value as boolean,
            );
        } else if (key === CONFIG_KEYS.ACTIONS_FEED_HEIGHT) {
            this._setFeedHeight(value as number);
        }
    }

    /**
     * Checks if the current page is the dashboard.
     */
    private _isTargetPage(): boolean {
        return document.location.href.includes(DASHBOARD_PAGE_MATCH);
    }

    /**
     * Applies all configuration values to the DOM.
     */
    private _applyConfig(): void {
        const hideIntro = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_INTRO, true);
        document.body.classList.toggle(DASHBOARD_CLEANER_SELECTORS.HIDE_INTRO_CLASS, hideIntro);

        const hideShortcuts = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_SOCIAL_SHORTCUTS, true);
        document.body.classList.toggle(
            DASHBOARD_CLEANER_SELECTORS.HIDE_SHORTCUTS_CLASS,
            hideShortcuts,
        );

        const height = this.getConfigValue<number>(CONFIG_KEYS.ACTIONS_FEED_HEIGHT, 490);
        this._setFeedHeight(height);
    }

    /**
     * Sets the actions feed height via a CSS custom property.
     * @param height - Height in pixels, or null to remove.
     */
    private _setFeedHeight(height: number | null): void {
        if (height === null) {
            document.documentElement.style.removeProperty('--tpi-actions-feed-height');
        } else {
            document.documentElement.style.setProperty('--tpi-actions-feed-height', `${height}px`);
        }
    }
}
