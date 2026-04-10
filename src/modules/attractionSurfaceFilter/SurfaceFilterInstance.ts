import { createElement } from '../../utils/DomUtils';
import { SURFACE_DEFAULTS, SURFACE_SELECTORS, SURFACE_STRINGS } from './constants';

/**
 * Represents a single instance of the surface area filter applied to a specific container (modal or page).
 */
export class SurfaceFilterInstance {
    private _root: HTMLElement;
    private _sliderGroup: HTMLElement | null = null;
    private _slider: HTMLInputElement | null = null;
    private _valueDisplay: HTMLElement | null = null;
    private _contentObserver: MutationObserver | null = null;
    private _uniqueId: string;
    private _updateTimeout: number | null = null;

    /**
     * Initializes the filter instance for the given root element.
     * @param root The root element (modal or page main area) to attach the filter to.
     */
    constructor(root: HTMLElement) {
        this._root = root;
        this._uniqueId = 'attraction-filter-surface-' + Math.random().toString(36).substring(2, 9);
        const filterContainer = root.querySelector(SURFACE_SELECTORS.FILTER_CONTAINER);
        if (filterContainer) {
            this._injectUI(filterContainer as HTMLElement);
            this._setupInteractions();
        }
    }

    /**
     * Destroys the instance, removing injected UI elements, styles, and observers.
     */
    public destroy(): void {
        this._sliderGroup?.remove();
        this._contentObserver?.disconnect();
        this._removeFilters();
        if (this._updateTimeout !== null) {
            window.clearTimeout(this._updateTimeout);
        }
        this._root.removeAttribute('data-surface-filter-initialized');
    }

    /**
     * Injects the slider UI into the filter container.
     * @param container The container element.
     */
    private _injectUI(container: HTMLElement): void {
        // Use the appropriate class based on the context (modal vs page)
        const isModal = this._root.classList.contains('attraction-store-modal');
        const labelClass = isModal ? 'attraction-store-modal__filter-label' : 'park-attractions-label';
        const groupClass = isModal ? 'attraction-store-modal__filter-group' : 'park-attractions-label';

        const label = createElement(
            'label',
            {
                class: labelClass,
                for: this._uniqueId,
                style: isModal ? '' : 'display: block; width: 100%;'
            },
            [SURFACE_STRINGS.LABEL],
        );

        this._slider = createElement('input', {
            type: 'range',
            id: this._uniqueId,
            class: 'attraction-surface-slider',
            min: SURFACE_DEFAULTS.MIN.toString(),
            max: this._calculateMaxSurface().toString(),
            step: SURFACE_DEFAULTS.STEP.toString(),
            value: this._calculateMaxSurface().toString(),
            style: 'width: 100%; margin-top: 5px;',
        }) as HTMLInputElement;

        this._valueDisplay = createElement(
            'span',
            {
                class: 'attraction-surface-slider-value',
                style: 'font-size: 0.8rem; color: var(--text-secondary); float: right;',
            },
            [SURFACE_STRINGS.ALL],
        );

        const labelContainer = createElement('div', { style: 'display: flex; justify-content: space-between; align-items: center; width: 100%;' }, [label, this._valueDisplay]);

        this._sliderGroup = createElement(
            'div',
            {
                class: groupClass,
                style: isModal ? '' : 'flex: 1; min-width: 200px; margin-right: 15px;'
            },
            [labelContainer, this._slider],
        );

        // Try to insert before the last group or at the end
        const lastGroup = container.lastElementChild;
        if (lastGroup && isModal) {
            container.insertBefore(this._sliderGroup, lastGroup);
        } else {
            container.appendChild(this._sliderGroup);
        }

        this._updateSliderFill();
    }

    /**
     * Handles content updates using debouncing to avoid excessive processing.
     */
    private _handleContentUpdateDebounced(): void {
        if (this._updateTimeout !== null) {
            window.clearTimeout(this._updateTimeout);
        }
        this._updateTimeout = window.setTimeout(() => {
            this._handleContentUpdate();
        }, 100);
    }

    /**
     * Sets up event listeners and the MutationObserver for the container.
     */
    private _setupInteractions(): void {
        if (!this._slider) return;

        this._slider.addEventListener('input', () => {
            this._updateValueDisplay();
            this._updateSliderFill();
            this._applyFilter();
        });

        const resetBtn = this._root.querySelector(SURFACE_SELECTORS.RESET_BTN);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this._slider) {
                    const max = this._calculateMaxSurface();
                    this._updateSliderRange(max);
                    this._slider.value = max.toString();
                    this._updateValueDisplay();
                    this._updateSliderFill();
                    this._applyFilter();
                }
            });
        }

        this._contentObserver = new MutationObserver(() => {
            this._handleContentUpdateDebounced();
        });

        const cardsContainer = this._root.querySelector(SURFACE_SELECTORS.LIST_CONTAINER);
        if (cardsContainer) {
            this._contentObserver.observe(cardsContainer, {
                attributes: true,
                attributeFilter: ['style'],
                childList: true,
                subtree: true,
            });
        }

        const typeSelect = this._root.querySelector(SURFACE_SELECTORS.TYPE_FILTER);
        const constructorSelect = this._root.querySelector(SURFACE_SELECTORS.CONSTRUCTOR_FILTER);

        const updateHandler = () => {
            this._handleContentUpdateDebounced();
            window.setTimeout(() => this._handleContentUpdateDebounced(), 1000);
        };

        if (typeSelect) typeSelect.addEventListener('change', updateHandler);
        if (constructorSelect) constructorSelect.addEventListener('change', updateHandler);
    }

    /**
     * Handles content updates: recalculates the max boundary and applies the filter.
     */
    private _handleContentUpdate(): void {
        const newMax = this._calculateMaxSurface();
        this._updateSliderRange(newMax);

        if (this._slider) {
            const currentVal = parseInt(this._slider.value);
            const prevMax = parseInt(this._slider.max);

            if (currentVal >= prevMax) {
                this._slider.value = newMax.toString();
            } else if (currentVal > newMax) {
                this._slider.value = newMax.toString();
            }

            this._updateValueDisplay();
            this._updateSliderFill();
            this._applyFilter();
        }

        this._updateCounter();
    }

    /**
     * Updates the text display with the current slider value.
     */
    private _updateValueDisplay(): void {
        if (!this._slider || !this._valueDisplay) return;

        const value = parseInt(this._slider.value);
        const max = parseInt(this._slider.max);

        if (value >= max) {
            this._valueDisplay.textContent = SURFACE_STRINGS.ALL;
        } else {
            this._valueDisplay.textContent = `${value} ${SURFACE_STRINGS.UNIT}`;
        }
    }

    /**
     * Applies the filter based on the current slider value.
     */
    private _applyFilter(): void {
        if (!this._slider) return;

        const maxSurface = parseInt(this._slider.value);
        const limit = parseInt(this._slider.max);
        const cards = this._root.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);

        cards.forEach((card) => {
            if (maxSurface >= limit) {
                card.classList.remove(SURFACE_SELECTORS.HIDDEN_CLASS);
                return;
            }

            const surface = this._extractSurface(card);
            if (surface > maxSurface) {
                card.classList.add(SURFACE_SELECTORS.HIDDEN_CLASS);
            } else {
                card.classList.remove(SURFACE_SELECTORS.HIDDEN_CLASS);
            }
        });

        this._updateCounter();
    }

    /**
     * Extracts the surface area from an attraction card.
     * @param card The attraction card element.
     * @returns The surface area in m², or 0 if not found.
     */
    private _extractSurface(card: HTMLElement): number {
        const desc = card.querySelector(SURFACE_SELECTORS.CARD_DESCRIPTION);
        if (!desc) return 0;

        const text = desc.innerHTML;
        // Updated regex to support "Surface:" label used in the new pages
        const match = text.match(
            /(?:Emprise au sol|Surface occupée|Surface)\s*:\s*<strong>\s*([\d\s]+)\s*m²?/i,
        );

        if (match && match[1]) {
            return parseInt(match[1].replace(/\s/g, ''));
        }
        return 0;
    }

    /**
     * Updates the background fill of the slider to reflect its percentage visually.
     */
    private _updateSliderFill(): void {
        if (!this._slider) return;

        const val = parseInt(this._slider.value);
        const min = parseInt(this._slider.min) || 0;
        const max = parseInt(this._slider.max) || 100;

        if (max === min) {
            this._slider.style.background = `#35b3af`;
            return;
        }

        const percentage = ((val - min) * 100) / (max - min);
        this._slider.style.background = `linear-gradient(to right, #35b3af 0%, #35b3af ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`;
    }

    /**
     * Removes the hidden class from all cards inside the root.
     */
    private _removeFilters(): void {
        this._root.querySelectorAll(`.${SURFACE_SELECTORS.HIDDEN_CLASS}`).forEach((el) => {
            el.classList.remove(SURFACE_SELECTORS.HIDDEN_CLASS);
        });
    }

    /**
     * Updates the counter of visible attractions.
     */
    private _updateCounter(): void {
        const counterEl = this._root.querySelector(SURFACE_SELECTORS.COUNTER);
        if (!counterEl) return;

        const cards = this._root.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);
        let visibleCount = 0;

        cards.forEach((card) => {
            const style = window.getComputedStyle(card);
            if (style.display !== 'none' && !card.classList.contains(SURFACE_SELECTORS.HIDDEN_CLASS)) {
                visibleCount++;
            }
        });

        counterEl.textContent = visibleCount.toString();
    }

    /**
     * Calculates the maximum surface parameter extracted from all visible cards.
     * @returns The dynamically calculated maximum surface, rounded to the step grid, or fallback default.
     */
    private _calculateMaxSurface(): number {
        const cards = this._root.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);
        let max = 0;

        const typeFilter = this._root.querySelector<HTMLSelectElement>(
            SURFACE_SELECTORS.TYPE_FILTER,
        );
        const constructorFilter = this._root.querySelector<HTMLSelectElement>(
            SURFACE_SELECTORS.CONSTRUCTOR_FILTER,
        );

        const selectedType = typeFilter ? typeFilter.value : '';
        const selectedConstructor = constructorFilter ? constructorFilter.value : '';

        cards.forEach((card) => {
            // Check Type Filter
            if (selectedType && selectedType !== '') {
                if (card.dataset.type !== selectedType) {
                    return;
                }
            }

            // Check Constructor Filter
            if (selectedConstructor && selectedConstructor !== '') {
                if (card.dataset['constructor'] !== selectedConstructor) {
                    return;
                }
            }

            const surface = this._extractSurface(card);
            if (surface > max) {
                max = surface;
            }
        });

        if (max > 0) {
            return Math.ceil(max / SURFACE_DEFAULTS.STEP) * SURFACE_DEFAULTS.STEP;
        }

        return SURFACE_DEFAULTS.MAX;
    }

    /**
     * Updates the slider's maximum boundary range attribute.
     * @param newMax The absolute new maximum dynamic value.
     */
    private _updateSliderRange(newMax: number): void {
        if (!this._slider) return;
        this._slider.max = newMax.toString();
    }
}
