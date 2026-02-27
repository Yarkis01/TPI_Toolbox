import { BaseFeature } from '../abstract/BaseFeature';
import { PLANNING_SELECTORS } from '../constants';

// @ts-ignore
import styles from './quickNavigation.scss?inline';
import { injectStyle } from '../../../utils/DomUtils';

/**
 * Identifiers for the secondary select wrappers paired with their select element.
 */
const SECONDARY_SELECTS = [
    { wrapId: PLANNING_SELECTORS.BOUTIQUE_WRAP, selectId: PLANNING_SELECTORS.BOUTIQUE_SELECT },
    {
        wrapId: PLANNING_SELECTORS.RESTAURANT_WRAP,
        selectId: PLANNING_SELECTORS.RESTAURANT_SELECT,
    },
    {
        wrapId: PLANNING_SELECTORS.SPECTACLE_WRAP,
        selectId: PLANNING_SELECTORS.SPECTACLE_SELECT,
    },
    {
        wrapId: PLANNING_SELECTORS.ATTRACTION_WRAP,
        selectId: PLANNING_SELECTORS.ATTRACTION_SELECT,
    },
] as const;

/**
 * QuickNavigationFeature
 * Adds previous/next navigation buttons next to secondary selectors (boutique, restaurant, etc.)
 * to allow quick cycling through planning options without using the dropdown.
 */
export class QuickNavigationFeature extends BaseFeature {
    private _injectedElements: HTMLElement[] = [];
    private _observer: MutationObserver | null = null;

    public get id(): string {
        return 'quick_navigation';
    }

    public get name(): string {
        return 'Navigation Rapide';
    }

    public get description(): string {
        return 'Ajoute des boutons précédent/suivant pour naviguer rapidement entre les plannings.';
    }

    protected onEnable(): void {
        injectStyle(styles);
        this._injectButtons();
        this._observeFilterChanges();
    }

    protected onDisable(): void {
        this._injectedElements.forEach((el) => el.remove());
        this._injectedElements = [];
        this._observer?.disconnect();
        this._observer = null;
    }

    /**
     * Observes visibility changes on the filter wrappers to re-inject buttons
     * when the user switches employee type and a new secondary selector appears.
     */
    private _observeFilterChanges(): void {
        const filtersContainer = document.querySelector(PLANNING_SELECTORS.FILTERS);
        if (!filtersContainer) return;

        this._observer = new MutationObserver(() => {
            // Clean old buttons and re-inject for the visible selectors
            this._injectedElements.forEach((el) => el.remove());
            this._injectedElements = [];
            this._injectButtons();
        });

        this._observer.observe(filtersContainer, {
            attributes: true,
            attributeFilter: ['hidden'],
            subtree: true,
        });
    }

    /**
     * Injects navigation buttons next to each visible secondary selector.
     */
    private _injectButtons(): void {
        for (const { wrapId, selectId } of SECONDARY_SELECTS) {
            const wrap = document.querySelector<HTMLElement>(wrapId);
            const select = document.querySelector<HTMLSelectElement>(selectId);

            // Only inject if the wrapper exists, is visible, and the select has valid options
            if (!wrap || !select || wrap.hidden) continue;

            const validOptions = this._getValidOptions(select);
            if (validOptions.length <= 1) continue;

            const label = wrap.querySelector<HTMLElement>('.planning-filters__label');
            if (!label) continue;

            const navContainer = this._createNavButtons(select, validOptions);
            // Insert the buttons right after the label text
            label.appendChild(navContainer);
            this._injectedElements.push(navContainer);
        }
    }

    /**
     * Gets valid (non-placeholder) options from a select element.
     * @param select - The select element.
     * @returns Array of option elements that have a non-empty value.
     */
    private _getValidOptions(select: HTMLSelectElement): HTMLOptionElement[] {
        return Array.from(select.options).filter((opt) => opt.value !== '');
    }

    /**
     * Creates the navigation button container with prev/next buttons.
     * @param select - The select element to control.
     * @param validOptions - The valid (non-placeholder) options.
     * @returns The container element with buttons.
     */
    private _createNavButtons(
        select: HTMLSelectElement,
        validOptions: HTMLOptionElement[],
    ): HTMLElement {
        const container = document.createElement('div');
        container.className = 'enhanced-planning-nav';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'enhanced-planning-nav__btn enhanced-planning-nav__btn--prev';
        prevBtn.title = 'Planning précédent';
        prevBtn.innerHTML = '&#9664;'; // ◄
        prevBtn.addEventListener('click', () => this._navigate(select, validOptions, -1));

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'enhanced-planning-nav__btn enhanced-planning-nav__btn--next';
        nextBtn.title = 'Planning suivant';
        nextBtn.innerHTML = '&#9654;'; // ►
        nextBtn.addEventListener('click', () => this._navigate(select, validOptions, 1));

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        return container;
    }

    /**
     * Navigates the select element by a given direction.
     * Wraps around when reaching the beginning or end of the list.
     * @param select - The select element to navigate.
     * @param validOptions - The valid options to cycle through.
     * @param direction - -1 for previous, +1 for next.
     */
    private _navigate(
        select: HTMLSelectElement,
        validOptions: HTMLOptionElement[],
        direction: -1 | 1,
    ): void {
        const currentIndex = validOptions.findIndex((opt) => opt.value === select.value);

        let nextIndex: number;
        if (currentIndex === -1) {
            // No valid option selected, go to first or last based on direction
            nextIndex = direction === 1 ? 0 : validOptions.length - 1;
        } else {
            nextIndex = (currentIndex + direction + validOptions.length) % validOptions.length;
        }

        select.value = validOptions[nextIndex].value;

        // Dispatch a change event so the game's JS reacts to the selection change
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
