import { BaseModule } from '../../core/abstract/BaseModule';
import { createElement } from '../../utils/DomUtils';
import { ZONE_SELECTORS, ZONE_STRINGS } from './constants';

/**
 * Module to add a zone filter on the attractions page.
 */
export class ZoneFilterModule extends BaseModule {
    private _zones: Set<string> = new Set();
    private _selectElement: HTMLSelectElement | null = null;
    private _filterGroup: HTMLElement | null = null;
    private _styleElement: HTMLStyleElement | null = null;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'zone_filter';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Filtre de Zone';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Ajoute un filtre par zone thématique sur la page des attractions.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        const container = document.querySelector(ZONE_SELECTORS.FILTER_CONTAINER);
        if (window.location.href.includes(ZONE_SELECTORS.PAGE_MATCH) &&container) {
            this._injectStyles();
            this._scanZones();

            if (this._zones.size > 0) {
                this._injectUI(container as HTMLElement);
                this._setupInteractions();
            }
        }
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._filterGroup?.remove();
        this._styleElement?.remove();

        document.querySelectorAll(`.${ZONE_SELECTORS.HIDDEN_CLASS}`).forEach((el) => {
            el.classList.remove(ZONE_SELECTORS.HIDDEN_CLASS);
        });

        this._updateCounter();

        this._filterGroup = null;
        this._selectElement = null;
        this._styleElement = null;
    }

    /**
     * Injects necessary CSS styles to hide elements.
     */
    private _injectStyles(): void {
        this._styleElement = document.createElement('style');
        this._styleElement.innerHTML = `
            .${ZONE_SELECTORS.HIDDEN_CLASS} {
                display: none !important;
            }
        `;
        document.head.appendChild(this._styleElement);
    }

    /**
     * Scans the page for available zones based on group headers.
     */
    private _scanZones(): void {
        const headers = document.querySelectorAll(ZONE_SELECTORS.ZONE_HEADER_NAME);
        headers.forEach((header) => {
            const zoneName = header.textContent?.trim();
            if (zoneName) {
                this._zones.add(zoneName);
            }
        });
    }

    /**
     * Injects the filter UI into the page.
     * @param container The container element to inject the UI into.
     */
    private _injectUI(container: HTMLElement): void {
        const label = createElement(
            'label',
            {
                for: ZONE_SELECTORS.FILTER_ID,
                class: ZONE_SELECTORS.SITE_LABEL,
            },
            [ZONE_STRINGS.LABEL],
        );

        this._selectElement = createElement('select', {
            id: ZONE_SELECTORS.FILTER_ID,
            class: ZONE_SELECTORS.SITE_SELECT,
        });

        this._selectElement.add(new Option(ZONE_STRINGS.DEFAULT_OPTION, ''));

        Array.from(this._zones)
            .sort()
            .forEach((zone) => {
                this._selectElement?.add(new Option(zone, zone));
            });

        this._filterGroup = createElement(
            'div',
            {
                class: ZONE_SELECTORS.SITE_FILTER_GROUP,
            },
            [label, this._selectElement],
        );

        container.appendChild(this._filterGroup);
    }

    /**
     * Sets up event listeners for the filter UI.
     */
    private _setupInteractions(): void {
        if (this._selectElement) {
            this._selectElement.addEventListener('change', () => {
                this._applyFilter();
            });

            const resetBtn = document.querySelector(ZONE_SELECTORS.RESET_BTN);
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (this._selectElement) this._selectElement.value = '';
                    this._applyFilter();
                });
            }

            const otherSelects = document.querySelectorAll(
                `select.${ZONE_SELECTORS.SITE_SELECT}:not(#${ZONE_SELECTORS.FILTER_ID})`,
            );
            otherSelects.forEach((sel) => {
                sel.addEventListener('change', () => {
                    setTimeout(() => this._updateCounter(), 50);
                });
            });
        }
    }

    /**
     * Applies the selected zone filter to the zone groups.
     */
    private _applyFilter(): void {
        const selectedZone = this._selectElement?.value || '';
        const groups = document.querySelectorAll<HTMLElement>(ZONE_SELECTORS.ZONE_GROUP);

        groups.forEach((group) => {
            const nameElement = group.querySelector(ZONE_SELECTORS.ZONE_HEADER_NAME);
            const groupZoneName = nameElement?.textContent?.trim() || '';

            if (selectedZone === '' || groupZoneName === selectedZone) {
                group.classList.remove(ZONE_SELECTORS.HIDDEN_CLASS);
            } else {
                group.classList.add(ZONE_SELECTORS.HIDDEN_CLASS);
            }
        });

        this._updateCounter();
    }

    /**
     * Updates the visible attractions counter.
     */
    private _updateCounter(): void {
        const counterEl = document.querySelector(ZONE_SELECTORS.COUNTER);
        const cards = document.querySelectorAll<HTMLElement>(ZONE_SELECTORS.CARD);

        if (counterEl) {
            let visibleCount = 0;

            cards.forEach((card) => {
                const parentGroup = card.closest(ZONE_SELECTORS.ZONE_GROUP);
                
                const isGroupHidden = parentGroup?.classList.contains(ZONE_SELECTORS.HIDDEN_CLASS);
                const isCardHidden = window.getComputedStyle(card).display === 'none';

                if (!isGroupHidden && !isCardHidden) {
                    visibleCount++;
                }
            });

            counterEl.textContent = visibleCount.toString();
            this._logger.debug(`Counter updated: ${visibleCount}`); 
        }
    }
}