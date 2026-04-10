import { BaseModule } from '../../../core/abstract/BaseModule';
import { CAPACITY_COLORS, CAPACITY_EVALUATION, PAGE_CONFIGS } from './constants';

/**
 * Module to colorize the warehouse card based on storage capacity.
 */
export class WarehouseColorizerModule extends BaseModule {
    private _modifiedElements: HTMLElement[] = [];

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'warehouse_colorizer';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return "Colorisation de l'entrepôt";
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Ajoute une bordure colorée selon la capacité de l'entrepôt.";
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!this._isValidPage()) {
            return;
        }

        const warehouseCard = this._findWarehouseCard();
        if (!warehouseCard) {
            this._logger.debug('Warehouse card not found (#expand-entrepot-open).');
            return;
        }

        this._applyCapacityBorder(warehouseCard);
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._removeCapacityBorders();
        this._modifiedElements = [];
    }

    /**
     * Checks if the current page is valid for this module.
     */
    private _isValidPage(): boolean {
        const currentUrl = window.location.href;
        return PAGE_CONFIGS.some((config) => currentUrl.includes(config.urlFragment));
    }

    /**
     * Finds the warehouse card in the DOM.
     */
    private _findWarehouseCard(): HTMLElement | null {
        const expandButton = document.querySelector<HTMLElement>('#expand-entrepot-open');
        if (!expandButton) {
            return null;
        }

        return expandButton.closest<HTMLElement>('section.dash-block');
    }

    /**
     * Applies a colored border based on storage capacity.
     *
     * @param warehouseCard - The warehouse card element.
     */
    private _applyCapacityBorder(warehouseCard: HTMLElement): void {
        const capacityData = this._extractCapacityData(warehouseCard);
        if (!capacityData) {
            return;
        }

        const borderStyle = this._calculateBorderStyle(capacityData.current, capacityData.max);
        if (borderStyle) {
            warehouseCard.style.border = borderStyle;
            this._modifiedElements.push(warehouseCard);
        }
    }

    /**
     * Extracts capacity data from the warehouse card badge (e.g. "19 800 / 20 000").
     *
     * @param warehouseCard - The warehouse card element.
     * @returns The current and maximum capacity, or null if unavailable/invalid.
     */
    private _extractCapacityData(
        warehouseCard: HTMLElement,
    ): { current: number; max: number } | null {
        const badge = warehouseCard.querySelector<HTMLElement>('.park-backstage-head-badge');
        if (!badge) {
            return null;
        }

        const rawText = this._normalizeText(badge.textContent);
        const match = rawText.match(/([\d\s]+)\/([\d\s]+)/);

        if (!match) {
            return null;
        }

        const current = this._parseNumberWithSpaces(match[1]);
        const max = this._parseNumberWithSpaces(match[2]);

        if (current === null || max === null) {
            return null;
        }

        return { current, max };
    }

    /**
     * Calculates the appropriate border style based on capacity.
     */
    private _calculateBorderStyle(current: number, max: number): string | null {
        if (current > max) {
            return CAPACITY_COLORS.OVERFILLED;
        }

        if (current === max) {
            return CAPACITY_COLORS.FILLED;
        }

        const remaining = max - current;

        if (remaining >= CAPACITY_EVALUATION.ENOUGTH) {
            return CAPACITY_COLORS.ENOUGTH;
        }

        return CAPACITY_COLORS.WARNING;
    }

    /**
     * Removes all capacity borders applied by this module.
     */
    private _removeCapacityBorders(): void {
        this._modifiedElements.forEach((element) => {
            element.style.border = '';
        });
    }

    /**
     * Parses a number that may contain spaces as thousands separators (e.g. "19 800").
     *
     * @param raw - Raw numeric text.
     * @returns Parsed number, or null if invalid.
     */
    private _parseNumberWithSpaces(raw: string): number | null {
        const cleaned = raw.replace(/\s+/g, '').replace(',', '.');
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
    }

    /**
     * Normalizes text by removing extra whitespace.
     */
    private _normalizeText(text: string | null | undefined): string {
        return (text ?? '').replace(/\s+/g, ' ').trim();
    }
}
