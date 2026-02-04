import { BaseModule } from '../../core/abstract/BaseModule';
import { createElement } from '../../utils/DomUtils';
import { SURFACE_DEFAULTS, SURFACE_SELECTORS, SURFACE_STRINGS } from './constants';

/**
 * Module to filter attractions by surface area in the marketplace.
 */
export class AttractionSurfaceFilterModule extends BaseModule {
    private _sliderGroup: HTMLElement | null = null;
    private _slider: HTMLInputElement | null = null;
    private _valueDisplay: HTMLElement | null = null;
    private _styleElement: HTMLStyleElement | null = null;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'attraction_surface_filter';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Filtre de Surface';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Ajoute un slider pour filtrer les attractions par superficie maximum.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        this._waitForModal();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._sliderGroup?.remove();
        this._styleElement?.remove();
        this._sliderGroup = null;
        this._slider = null;
        this._valueDisplay = null;
        this._styleElement = null;
        this._removeFilters();
    }

    /**
     * Waits for the attraction store modal to appear.
     */
    private _waitForModal(): void {
        const observer = new MutationObserver((mutations, obs) => {
            const modal = document.querySelector(SURFACE_SELECTORS.MODAL);
            if (modal) {
                const filterContainer = modal.querySelector(SURFACE_SELECTORS.FILTER_CONTAINER);
                if (filterContainer && !document.getElementById(SURFACE_SELECTORS.SLIDER_ID)) {
                    this._injectUI(filterContainer as HTMLElement);
                    this._injectStyles();
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Initial check
        const modal = document.querySelector(SURFACE_SELECTORS.MODAL);
        if (modal) {
            const filterContainer = modal.querySelector(SURFACE_SELECTORS.FILTER_CONTAINER);
            if (filterContainer && !document.getElementById(SURFACE_SELECTORS.SLIDER_ID)) {
                this._injectUI(filterContainer as HTMLElement);
                this._injectStyles();
            }
        }
    }

    /**
     * Injects the slider UI into the filter container.
     * @param container The container element.
     */
    private _injectUI(container: HTMLElement): void {
        const label = createElement('label', {
            class: 'attraction-store-modal__filter-label',
            for: SURFACE_SELECTORS.SLIDER_ID
        }, [SURFACE_STRINGS.LABEL]);

        this._slider = createElement('input', {
            type: 'range',
            id: SURFACE_SELECTORS.SLIDER_ID,
            class: 'attraction-store-modal__range',
            min: SURFACE_DEFAULTS.MIN.toString(),
            max: this._calculateMaxSurface().toString(), // Use dynamic max
            step: SURFACE_DEFAULTS.STEP.toString(),
            value: this._calculateMaxSurface().toString(), // Start with all selected
            style: 'width: 100%; margin-top: 5px;'
        }) as HTMLInputElement;

        this._valueDisplay = createElement('span', {
            id: SURFACE_SELECTORS.SLIDER_VALUE_ID,
            style: 'font-size: 0.8rem; color: var(--text-secondary); float: right;'
        }, [SURFACE_STRINGS.ALL]);

        const labelContainer = createElement('div', {}, [label, this._valueDisplay]);

        this._sliderGroup = createElement('div', {
            class: 'attraction-store-modal__filter-group'
        }, [labelContainer, this._slider]);

        // Insert before the last filter group (usually the checkbox)
        const lastGroup = container.lastElementChild;
        if (lastGroup) {
            container.insertBefore(this._sliderGroup, lastGroup);
        } else {
            container.appendChild(this._sliderGroup);
        }

        this._updateSliderFill();
        this._setupInteractions();
    }

    /**
     * Injects custom styles for the slider.
     */
    private _injectStyles(): void {
        this._styleElement = document.createElement('style');
        this._styleElement.innerHTML = `
            #${SURFACE_SELECTORS.SLIDER_ID} {
                -webkit-appearance: none;
                width: 100%;
                height: 6px;
                background: #2a2a2a;
                border-radius: 3px;
                outline: none;
                margin-top: 10px;
                margin-bottom: 5px;
            }

            #${SURFACE_SELECTORS.SLIDER_ID}::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #35b3af;
                cursor: pointer;
                transition: background .15s ease-in-out, transform .15s ease-in-out;
                border: 2px solid #1a1a1a;
            }

            #${SURFACE_SELECTORS.SLIDER_ID}::-webkit-slider-thumb:hover {
                background: #2a8f8c;
                transform: scale(1.1);
            }

            .${SURFACE_SELECTORS.HIDDEN_CLASS} {
                display: none !important;
            }
        `;
        document.head.appendChild(this._styleElement);
    }

    /**
     * Sets up event listeners for the slider and other elements.
     */
    private _setupInteractions(): void {
        if (!this._slider) return;

        this._slider.addEventListener('input', () => {
            this._updateValueDisplay();
            this._updateSliderFill();
            this._applyFilter();
        });

        const resetBtn = document.querySelector(SURFACE_SELECTORS.RESET_BTN);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this._slider) {
                    // Reset to the current calculated max
                    const max = this._calculateMaxSurface();
                    this._updateSliderRange(max); // Ensure range is correct
                    this._slider.value = max.toString();
                    this._updateValueDisplay();
                    this._updateSliderFill();
                    this._applyFilter();
                }
            });
        }

        // Listen for store content changes        // Listen for other filters to update count correctly
        const observer = new MutationObserver(() => {
            this._handleContentUpdate();
        });

        const cardsContainer = document.querySelector('.attraction-store-modal__body');
        if (cardsContainer) {
            observer.observe(cardsContainer, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                childList: true,
                subtree: true
            });
        }

        // Fallback for Type/Constructor switching (in case Observer misses the swap or runs too early)
        const typeSelect = document.querySelector(SURFACE_SELECTORS.TYPE_FILTER);
        const constructorSelect = document.querySelector('#attraction-filter-constructor');

        const updateHandler = () => {
            // Wait for the app to potentially replace the DOM
            setTimeout(() => this._handleContentUpdate(), 200);
            setTimeout(() => this._handleContentUpdate(), 1000); // Safety double-check
        };

        if (typeSelect) typeSelect.addEventListener('change', updateHandler);
        if (constructorSelect) constructorSelect.addEventListener('change', updateHandler);
    }

    /**
     * Handles content updates: recalculates max and applies filter.
     */
    private _handleContentUpdate(): void {
        const newMax = this._calculateMaxSurface();
        this._updateSliderRange(newMax);

        if (this._slider) {
            const currentVal = parseInt(this._slider.value);
            const prevMax = parseInt(this._slider.max);

            // If it was at previous max, move to new max (keep "All" selected)
            if (currentVal >= prevMax) {
                this._slider.value = newMax.toString();
            }
            // If the current value is now impossible, clamp it
            else if (currentVal > newMax) {
                this._slider.value = newMax.toString();
            }

            this._updateValueDisplay();
            this._updateSliderFill();
            this._applyFilter();
        }

        this._updateCounter();
    }

    /**
     * Updates the text display of the current slider value.
     * @param _ (unused)
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
     * Applies the filter based on the slider value.
     */
    private _applyFilter(): void {
        if (!this._slider) return;

        const maxSurface = parseInt(this._slider.value);
        const limit = parseInt(this._slider.max);
        const cards = document.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);

        cards.forEach(card => {
            // If slider is at max, show everything regardless of extraction errors or huge values
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
     * @returns The surface area in m².
     */
    private _extractSurface(card: HTMLElement): number {
        const desc = card.querySelector(SURFACE_SELECTORS.CARD_DESCRIPTION);
        if (!desc) return 0;

        const text = desc.innerHTML;
        const match = text.match(/Emprise au sol\s*:\s*<strong>\s*([\d\s]+)\s*m²/);

        if (match && match[1]) {
            return parseInt(match[1].replace(/\s/g, ''));
        }
        return 0;
    }

    /**
     * Updates the background fill of the slider to match the value.
     */
    private _updateSliderFill(): void {
        if (!this._slider) return;

        const val = parseInt(this._slider.value);
        const min = parseInt(this._slider.min) || 0;
        const max = parseInt(this._slider.max) || 100;

        const percentage = ((val - min) * 100) / (max - min);

        this._slider.style.background = `linear-gradient(to right, #35b3af 0%, #35b3af ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`;
    }

    /**
     * Removes all filters applied by this module.
     */
    private _removeFilters(): void {
        document.querySelectorAll(`.${SURFACE_SELECTORS.HIDDEN_CLASS}`).forEach(el => {
            el.classList.remove(SURFACE_SELECTORS.HIDDEN_CLASS);
        });
    }

    /**
     * Updates the counter of visible attractions.
     */
    private _updateCounter(): void {
        const counterEl = document.querySelector(SURFACE_SELECTORS.COUNTER);
        if (!counterEl) return;

        const cards = document.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);
        let visibleCount = 0;

        cards.forEach(card => {
            const style = window.getComputedStyle(card);
            if (style.display !== 'none') {
                visibleCount++;
            }
        });

        counterEl.textContent = visibleCount.toString();
    }
    /**
     * Calculates the maximum surface from all visible cards.
     * @returns The maximum surface found, or default max if none/smaller.
     */
    private _calculateMaxSurface(): number {
        const cards = document.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);
        let max = 0;

        const typeFilter = document.querySelector<HTMLSelectElement>(SURFACE_SELECTORS.TYPE_FILTER);
        const constructorFilter = document.querySelector<HTMLSelectElement>('#attraction-filter-constructor');

        const selectedType = typeFilter ? typeFilter.value : '';
        const selectedConstructor = constructorFilter ? constructorFilter.value : '';

        cards.forEach(card => {
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

        // Round up to nearest step for cleaner UI
        if (max > 0) {
            return Math.ceil(max / SURFACE_DEFAULTS.STEP) * SURFACE_DEFAULTS.STEP;
        }

        return SURFACE_DEFAULTS.MAX;
    }

    /**
     * Updates the slider's min/max attributes.
     * @param newMax The new maximum value
     */
    private _updateSliderRange(newMax: number): void {
        if (!this._slider) return;
        this._slider.max = newMax.toString();
    }
}
