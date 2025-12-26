import { BaseModule } from '../../core/abstract/BaseModule';
import { PAGE_CONFIGS, STATUS_COLORS } from './constants';

/**
 * Module to colorize entity statuses on various pages.
 */
export class EntityStatusColorizerModule extends BaseModule {
    private _modifiedElements: HTMLElement[] = [];

    /**
     * @inheritdoc
     */
    public get id() {
        return 'entity_status_colorizer';
    }

    /**
     * @inheritdoc
     */
    public get name() {
        return 'Colorisation des Statuts';
    }

    /**
     * @inheritdoc
     */
    public get description() {
        return "Ajoute une bordure colorée selon l'état (Ouvert, Fermé, etc.).";
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        const currentUrl = window.location.href;
        const config = PAGE_CONFIGS.find((c) => currentUrl.includes(c.urlFragment));

        if (!config) return;

        const elements = document.querySelectorAll<HTMLElement>(config.selector);
        this._logger.debug(`Processing ${elements.length} elements for page match.`);

        elements.forEach((el) => {
            const status = config.getStatus(el);
            const borderStyle = this._getBorderByStatus(status);

            if (borderStyle) {
                el.style.border = borderStyle;
                this._modifiedElements.push(el);
            }
        });
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._modifiedElements.forEach((el) => {
            el.style.border = '';
        });

        this._modifiedElements = [];
    }

    /**
     * Determines the border style based on the entity status.
     * @param status The status string.
     * @returns The corresponding border style or null if unknown.
     */
    private _getBorderByStatus(status: string): string | null {
        let color: string | null = null;

        if (status.includes('ouvert') || status.includes('assigné') || status.includes('actif')) {
            color = STATUS_COLORS.OPEN;
        } else if (status.includes('ferme') || status.includes('fermé') || status.includes('non assigné')) {
            color = STATUS_COLORS.CLOSED;
        } else if (status.includes('travaux')) {
            color = STATUS_COLORS.WORK;
        } else if (status.includes('vente')) {
            color = STATUS_COLORS.SALE;
        }

        return color;
    }
}
