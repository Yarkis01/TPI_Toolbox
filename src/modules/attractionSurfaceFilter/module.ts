import { BaseModule } from '../../core/abstract/BaseModule';
import { createElement } from '../../utils/DomUtils';
import { SURFACE_DEFAULTS, SURFACE_SELECTORS, SURFACE_STRINGS } from './constants';

export class AttractionSurfaceFilterModule extends BaseModule {
    private _sliderGroup: HTMLElement | null = null;
    private _slider: HTMLInputElement | null = null;
    private _valueDisplay: HTMLElement | null = null;
    private _styleElement: HTMLStyleElement | null = null;

    public get id(): string {
        return 'attraction_surface_filter';
    }

    public get name(): string {
        return 'Filtre de Surface';
    }

    public get description(): string {
        return 'Ajoute un slider pour filtrer les attractions par superficie maximum.';
    }

    protected onEnable(): void {
        this._waitForModal();
    }

    protected onDisable(): void {
        this._sliderGroup?.remove();
        this._styleElement?.remove();
        this._sliderGroup = null;
        this._slider = null;
        this._valueDisplay = null;
        this._styleElement = null;
        this._removeFilters();
    }

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
            max: SURFACE_DEFAULTS.MAX.toString(),
            step: SURFACE_DEFAULTS.STEP.toString(),
            value: SURFACE_DEFAULTS.MAX.toString(),
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
                    this._slider.value = SURFACE_DEFAULTS.MAX.toString();
                    this._updateValueDisplay();
                    this._updateSliderFill();
                    this._applyFilter();
                }
            });
        }

        // Listen for other filters to update count correctly
        const observer = new MutationObserver(() => {
            this._updateCounter();
        });

        const cardsContainer = document.querySelector('.attraction-store-modal__body');
        if (cardsContainer) {
            observer.observe(cardsContainer, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
        }
    }

    private _updateValueDisplay(): void {
        if (!this._slider || !this._valueDisplay) return;

        const value = parseInt(this._slider.value);
        if (value >= SURFACE_DEFAULTS.MAX) {
            this._valueDisplay.textContent = SURFACE_STRINGS.ALL;
        } else {
            this._valueDisplay.textContent = `${value} ${SURFACE_STRINGS.UNIT}`;
        }
    }

    private _applyFilter(): void {
        if (!this._slider) return;

        const maxSurface = parseInt(this._slider.value);
        const cards = document.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.CARD);

        cards.forEach(card => {
            const surface = this._extractSurface(card);
            if (surface > maxSurface) {
                card.classList.add(SURFACE_SELECTORS.HIDDEN_CLASS);
            } else {
                card.classList.remove(SURFACE_SELECTORS.HIDDEN_CLASS);
            }
        });

        this._updateCounter();
    }

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

    private _updateSliderFill(): void {
        if (!this._slider) return;

        const val = parseInt(this._slider.value);
        const min = parseInt(this._slider.min) || 0;
        const max = parseInt(this._slider.max) || 100;

        const percentage = ((val - min) * 100) / (max - min);

        this._slider.style.background = `linear-gradient(to right, #35b3af 0%, #35b3af ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`;
    }

    private _removeFilters(): void {
        document.querySelectorAll(`.${SURFACE_SELECTORS.HIDDEN_CLASS}`).forEach(el => {
            el.classList.remove(SURFACE_SELECTORS.HIDDEN_CLASS);
        });
    }

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
}
