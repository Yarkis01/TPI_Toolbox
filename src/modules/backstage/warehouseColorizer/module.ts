import { BaseModule } from '../../../core/abstract/BaseModule';
import { PAGE_CONFIGS, CAPACITY_COLORS, CAPACITY_EVALUATION } from './constants';

/**
 * Module to colorize the warehouse card based on storage capacity and add a stacked fill bar
 * for restaurant types (foodtrucks / fastfoods / sit-down).
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
        return 'Colorisation de l’entrepôt';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Ajoute une bordure colorée selon la capacité de l'entrepôt et une barre de remplissage par type.";
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
            this._logger.debug("Warehouse card not found (#expand-entrepot-restaurant-btn).");
            return;
        }

        this._applyCapacityBorder(warehouseCard);
        this._injectRestaurantTypesFillBar(warehouseCard);
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._removeCapacityBorders();
        this._removeRestaurantTypesFillBars();
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
        const expandButton = document.querySelector<HTMLElement>('#expand-entrepot-restaurant-btn');
        if (!expandButton) {
            return null;
        }

        return expandButton.closest<HTMLElement>('.backstage-card');
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
     * Extracts capacity data from the warehouse card badge (e.g. "20400 / 32000").
     *
     * @param warehouseCard - The warehouse card element.
     * @returns The current and maximum capacity, or null if unavailable/invalid.
     */
    private _extractCapacityData(warehouseCard: HTMLElement): { current: number; max: number } | null {
        const badge = warehouseCard.querySelector<HTMLElement>('.backstage-card__badge');
        if (!badge) {
            return null;
        }

        const rawText = this._normalizeText(badge.textContent);
        const match = rawText.match(/(\d+)\s*\/\s*(\d+)/);

        if (!match) {
            return null;
        }

        const current = Number(match[1]);
        const max = Number(match[2]);

        if (Number.isNaN(current) || Number.isNaN(max)) {
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
     * Injects a stacked fill bar (foodtrucks / fastfoods / sit-down) above
     * the "Espace necessaire aux foodtrucks :" line.
     *
     * Each segment is expressed as a percentage of the warehouse maximum capacity.
     *
     * @param warehouseCard - The warehouse card element.
     */
    private _injectRestaurantTypesFillBar(warehouseCard: HTMLElement): void {
        const capacity = this._extractCapacityData(warehouseCard);
        if (!capacity) {
            return;
        }

        const anchorItem = this._findFoodtrucksInfoItem(warehouseCard);
        if (!anchorItem) {
            return;
        }

        if (this._restaurantTypesFillBarAlreadyExists(warehouseCard)) {
            return;
        }

        const info = this._extractRestaurantTypesSpaces(warehouseCard);
        if (!info) {
            return;
        }

        const bar = this._createRestaurantTypesFillBar(info, capacity.max);
        anchorItem.parentElement?.insertBefore(bar, anchorItem);
    }

    /**
     * Finds the info item matching "Espace necessaire aux foodtrucks :".
     *
     * @param warehouseCard - The warehouse card element.
     * @returns The matching info item element, or null if not found.
     */
    private _findFoodtrucksInfoItem(warehouseCard: HTMLElement): HTMLElement | null {
        const infoItems = warehouseCard.querySelectorAll<HTMLElement>('.backstage-card__info-item');

        for (const item of infoItems) {
            const label = item.querySelector<HTMLElement>('.backstage-card__info-label');
            const labelText = this._normalizeText(label?.textContent).toLowerCase();

            if (labelText.startsWith('espace necessaire aux foodtrucks')) {
                return item;
            }
        }

        return null;
    }

    /**
     * Checks if the restaurant types fill bar already exists for this card.
     */
    private _restaurantTypesFillBarAlreadyExists(warehouseCard: HTMLElement): boolean {
        return warehouseCard.querySelector('[data-warehouse-types-fill-bar="1"]') !== null;
    }

    /**
     * Extracts the required spaces for the three restaurant types from the info list.
     *
     * @param warehouseCard - The warehouse card element.
     * @returns The spaces for foodtrucks, fastfoods, sitDown, or null if missing/invalid.
     */
    private _extractRestaurantTypesSpaces(
        warehouseCard: HTMLElement
    ): { foodtrucks: number; fastfoods: number; sitDown: number } | null {
        const mapping: Array<{
            key: 'foodtrucks' | 'fastfoods' | 'sitDown';
            labelStartsWith: string;
        }> = [
            { key: 'foodtrucks', labelStartsWith: 'espace necessaire aux foodtrucks' },
            { key: 'fastfoods', labelStartsWith: 'espace necessaire aux fastfoods' },
            { key: 'sitDown', labelStartsWith: 'espace necessaire aux restaurants' }
        ];

        const result: Partial<Record<'foodtrucks' | 'fastfoods' | 'sitDown', number>> = {};

        const infoItems = warehouseCard.querySelectorAll<HTMLElement>('.backstage-card__info-item');

        for (const item of infoItems) {
            const labelEl = item.querySelector<HTMLElement>('.backstage-card__info-label');
            const valueEl = item.querySelector<HTMLElement>('.backstage-card__info-value');
            if (!labelEl || !valueEl) {
                continue;
            }

            const labelText = this._normalizeText(labelEl.textContent).toLowerCase();
            const rawValue = this._normalizeText(valueEl.textContent);
            const value = this._parseNumberWithSpaces(rawValue);

            if (value === null) {
                continue;
            }

            for (const m of mapping) {
                if (labelText.startsWith(m.labelStartsWith)) {
                    result[m.key] = value;
                }
            }
        }

        const foodtrucks = result.foodtrucks;
        const fastfoods = result.fastfoods;
        const sitDown = result.sitDown;

        if (
            typeof foodtrucks !== 'number' ||
            typeof fastfoods !== 'number' ||
            typeof sitDown !== 'number'
        ) {
            return null;
        }

        return { foodtrucks, fastfoods, sitDown };
    }

    /**
     * Creates the stacked bar element.
     *
     * @param spaces - Spaces per type.
     * @param maxCapacity - Warehouse max capacity.
     * @returns The bar wrapper element.
     */
    private _createRestaurantTypesFillBar(
        spaces: { foodtrucks: number; fastfoods: number; sitDown: number },
        maxCapacity: number
    ): HTMLElement {
        const wrap = document.createElement('div');
        wrap.setAttribute('data-warehouse-types-fill-bar', '1');

        Object.assign(wrap.style, {
            width: '100%',
            margin: '6px 0 12px 0'
        });

        const foodPct = this._toPercent(spaces.foodtrucks, maxCapacity);
        const fastPct = this._toPercent(spaces.fastfoods, maxCapacity);
        const sitPct = this._toPercent(spaces.sitDown, maxCapacity);
        const filledPct = Math.max(0, Math.min(100, foodPct + fastPct + sitPct));
        const emptyPct = Math.max(0, 100 - filledPct);

        const bar = document.createElement('div');
        Object.assign(bar.style, {
            width: '100%',
            height: '14px',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            background: 'rgba(0,0,0,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)'
        });

        const makeSeg = (pct: number, color: string): HTMLElement => {
            const seg = document.createElement('span');

            Object.assign(seg.style, {
                height: '100%',
                background: color,
                flexGrow: String(pct),
                flexBasis: `${pct}%`,
                minWidth: pct > 0 ? '6px' : '0px'
            });

            return seg;
        };

        const foodSeg = makeSeg(foodPct, '#4C6FFF');
        const fastSeg = makeSeg(fastPct, '#FF9F0A');
        const sitSeg = makeSeg(sitPct, '#34C759');

        // Keep an explicit "empty" segment so the filled colors don't get stretched.
        const emptySeg = document.createElement('span');
        Object.assign(emptySeg.style, {
            height: '100%',
            background: 'transparent',
            flexGrow: String(emptyPct),
            flexBasis: `${emptyPct}%`,
            minWidth: '0px'
        });

        bar.appendChild(foodSeg);
        bar.appendChild(fastSeg);
        bar.appendChild(sitSeg);
        bar.appendChild(emptySeg);

        const legend = document.createElement('div');
        Object.assign(legend.style, {
            marginTop: '8px',
            fontSize: '12px',
            opacity: '0.9'
        });

        legend.textContent = `Foodtrucks: ${foodPct}% • Fastfoods: ${fastPct}% • Restaurants: ${sitPct}%`;

        wrap.appendChild(bar);
        wrap.appendChild(legend);

        return wrap;
    }

    /**
     * Removes all restaurant types fill bars created by this module.
     */
    private _removeRestaurantTypesFillBars(): void {
        const bars = document.querySelectorAll<HTMLElement>('[data-warehouse-types-fill-bar="1"]');
        bars.forEach((bar) => bar.remove());
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
     * Converts a value to a [0..100] percentage of max.
     */
    private _toPercent(value: number, max: number): number {
        if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
            return 0;
        }

        return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
    }

    /**
     * Parses a number that may contain spaces as thousands separators (e.g. "6 400").
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
