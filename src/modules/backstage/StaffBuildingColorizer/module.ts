import { BaseModule } from '../../../core/abstract/BaseModule';
import { PAGE_CONFIGS, CAPACITY_COLORS, CAPACITY_EVALUATION } from './constants';

/**
 * Module to colorize the staff building card and add mood visualization.
 */
export class StaffBuildingColorizerModule extends BaseModule {
    private _modifiedElements: HTMLElement[] = [];

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'staff_building_colorizer';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Colorisation du bâtiments des employés';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Ajoute une bordure colorée selon la capacité du bâtiment.";
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!this._isValidPage()) {
            return;
        }

        const staffCard = this._findStaffCard();
        if (!staffCard) {
            this._logger.debug('Staff building card not found (#backstage-expand-building-btn).');
            return;
        }

        this._applyCapacityBorder(staffCard);
        this._injectMoodBar(staffCard);
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._removeCapacityBorders();
        this._removeMoodBars();
        this._modifiedElements = [];
    }

    /**
     * Checks if the current page is valid for this module.
     *
     * @returns Whether the current page matches one of the configured URL fragments.
     */
    private _isValidPage(): boolean {
        const currentUrl = window.location.href;
        return PAGE_CONFIGS.some((config) => currentUrl.includes(config.urlFragment));
    }

    /**
     * Finds the staff building card in the DOM.
     *
     * @returns The staff building card element, or null if it cannot be found.
     */
    private _findStaffCard(): HTMLElement | null {
        const expandButton = document.querySelector<HTMLElement>('#backstage-expand-building-btn');
        if (!expandButton) {
            return null;
        }

        return expandButton.closest<HTMLElement>('.backstage-card');
    }

    /**
     * Applies a colored border based on staff capacity.
     *
     * @param staffCard - The staff building card element.
     */
    private _applyCapacityBorder(staffCard: HTMLElement): void {
        const capacityData = this._extractCapacityData(staffCard);
        if (!capacityData) {
            return;
        }

        const borderStyle = this._calculateBorderStyle(capacityData.current, capacityData.max);
        if (borderStyle) {
            staffCard.style.border = borderStyle;
            this._modifiedElements.push(staffCard);
        }
    }

    /**
     * Extracts capacity data from the staff card badge.
     *
     * @param staffCard - The staff building card element.
     * @returns The current and maximum capacity, or null if unavailable/invalid.
     */
    private _extractCapacityData(staffCard: HTMLElement): { current: number; max: number } | null {
        const badge = staffCard.querySelector<HTMLElement>('.backstage-card__badge');
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
     *
     * @param current - Current staff count.
     * @param max - Maximum staff capacity.
     * @returns The CSS border style to apply, or null if no border should be applied.
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
     * Injects a mood progress bar into the staff card.
     *
     * @param staffCard - The staff building card element.
     */
    private _injectMoodBar(staffCard: HTMLElement): void {
        const moodItem = this._findMoodInfoItem(staffCard);
        if (!moodItem) {
            return;
        }

        if (this._moodBarAlreadyExists(moodItem)) {
            return;
        }

        const moodPercentage = this._extractMoodPercentage(moodItem);
        if (moodPercentage === null) {
            return;
        }

        const moodBar = this._createMoodBar(moodPercentage);
        this._insertMoodBar(moodItem, moodBar);
    }

    /**
     * Finds the mood info item in the staff card.
     *
     * @param staffCard - The staff building card element.
     * @returns The mood info item element, or null if not found.
     */
    private _findMoodInfoItem(staffCard: HTMLElement): HTMLElement | null {
        const infoItems = staffCard.querySelectorAll<HTMLElement>('.backstage-card__info-item');

        for (const item of infoItems) {
            const label = item.querySelector<HTMLElement>('.backstage-card__info-label');
            const labelText = this._normalizeText(label?.textContent).toLowerCase();

            if (labelText.startsWith('humeur moyenne')) {
                return item;
            }
        }

        return null;
    }

    /**
     * Checks if a mood bar already exists in the mood item.
     *
     * @param moodItem - The mood info item element.
     * @returns True if the mood bar already exists, otherwise false.
     */
    private _moodBarAlreadyExists(moodItem: HTMLElement): boolean {
        return moodItem.querySelector('[data-staff-mood-bar="1"]') !== null;
    }

    /**
     * Extracts the mood percentage from the mood item.
     *
     * @param moodItem - The mood info item element.
     * @returns The normalized mood percentage in the range [0..100], or null if unavailable/invalid.
     */
    private _extractMoodPercentage(moodItem: HTMLElement): number | null {
        const valueEl = moodItem.querySelector<HTMLElement>('.backstage-card__info-value');
        if (!valueEl) {
            return null;
        }

        const rawValue = this._normalizeText(valueEl.textContent);
        const match = rawValue.match(/(\d+(?:[.,]\d+)?)\s*%/);

        if (!match) {
            return null;
        }

        const mood = Number(match[1].replace(',', '.'));

        if (Number.isNaN(mood)) {
            return null;
        }

        return Math.max(0, Math.min(100, mood));
    }

    /**
     * Creates the mood bar HTML element with gradient and visual effects.
     *
     * @param percentage - Mood percentage in the range [0..100].
     * @returns The mood bar container element.
     */
    private _createMoodBar(percentage: number): HTMLElement {
        const barWrap = this._createMoodBarContainer();
        const mask = this._createMoodBarMask(percentage);
        const gloss = this._createMoodBarGloss();

        barWrap.appendChild(mask);
        barWrap.appendChild(gloss);

        return barWrap;
    }

    /**
     * Creates the mood bar container element.
     *
     * @returns The mood bar container element.
     */
    private _createMoodBarContainer(): HTMLElement {
        const barWrap = document.createElement('span');
        barWrap.setAttribute('data-staff-mood-bar', '1');

        Object.assign(barWrap.style, {
            display: 'inline-block',
            verticalAlign: 'middle',
            width: '70%',
            height: '10px',
            margin: '0 8px',
            background: 'linear-gradient(90deg, #ff0d00ff 0%, #00ff40ff 100%)',
            position: 'relative',
            overflow: 'hidden',
        });

        return barWrap;
    }

    /**
     * Creates the mask overlay for the mood bar based on percentage.
     *
     * @param percentage - Mood percentage in the range [0..100].
     * @returns The mask element.
     */
    private _createMoodBarMask(percentage: number): HTMLElement {
        const mask = document.createElement('span');

        Object.assign(mask.style, {
            position: 'absolute',
            top: '0',
            right: '0',
            height: '100%',
            width: `${100 - percentage}%`,
            background: 'rgba(255,255,255,0.75)'
        });

        return mask;
    }

    /**
     * Creates the gloss overlay effect for the mood bar.
     *
     * @returns The gloss element.
     */
    private _createMoodBarGloss(): HTMLElement {
        const gloss = document.createElement('span');

        Object.assign(gloss.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            height: '100%',
            width: '100%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 60%)',
            pointerEvents: 'none'
        });

        return gloss;
    }

    /**
     * Inserts the mood bar before the value element.
     *
     * @param moodItem - The mood info item element.
     * @param moodBar - The mood bar element to insert.
     */
    private _insertMoodBar(moodItem: HTMLElement, moodBar: HTMLElement): void {
        const valueEl = moodItem.querySelector<HTMLElement>('.backstage-card__info-value');
        if (!valueEl || !valueEl.parentElement) {
            return;
        }

        valueEl.parentElement.insertBefore(moodBar, valueEl);
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
     * Removes all mood bars created by this module.
     */
    private _removeMoodBars(): void {
        const moodBars = document.querySelectorAll<HTMLElement>('[data-staff-mood-bar="1"]');
        moodBars.forEach((bar) => bar.remove());
    }

    /**
     * Normalizes text by removing extra whitespace.
     *
     * @param text - Raw text to normalize.
     * @returns Normalized text.
     */
    private _normalizeText(text: string | null | undefined): string {
        return (text ?? '').replace(/\s+/g, ' ').trim();
    }
}
