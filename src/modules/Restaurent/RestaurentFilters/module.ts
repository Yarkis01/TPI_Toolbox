import { BaseModule } from '../../../core/abstract/BaseModule';
import { createElement } from '../../../utils/DomUtils';
import { ZONE_IMAGES_URL, ZONE_SELECTORS, ZONE_STRINGS, STATUS_STRINGS } from './constants';
import './style.scss';

/**
 * Module to add a zone filter on the restaurants page.
 */
export class RestaurentFilterModule extends BaseModule {
    private _zones: Set<string> = new Set();
    private _selectElement: HTMLSelectElement | null = null;
    private _statusSelectElement: HTMLSelectElement | null = null;
    private _filterGroup: HTMLElement | null = null;
    private _styleElement: HTMLStyleElement | null = null;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'restaurent_filter';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Restaurant Zone Filter';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Adds a zone filter to the restaurants page.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        this.processRestaurantCards().then(() => {
            if (this._zones.size > 0) {
                this._groupRestaurants();
                this._injectUI();
            }
        });
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        // Clean up badges
        const badges = document.querySelectorAll('.owned-restaurant-card__zone-badge--injected');
        badges.forEach(el => el.remove());

        // Clean up filter UI
        if (this._filterGroup) {
            this._filterGroup.remove();
        }
        if (this._styleElement) {
            this._styleElement.remove();
        }

        // Clean up hidden classes
        document.querySelectorAll(`.${ZONE_SELECTORS.HIDDEN_CLASS}`).forEach((el) => {
            el.classList.remove(ZONE_SELECTORS.HIDDEN_CLASS);
        });

        // Reset references
        this._filterGroup = null;
        this._selectElement = null;
        this._statusSelectElement = null;
        this._styleElement = null;
        this._zones.clear();
    }



    /**
     * Scans restaurant cards and extracts zones.
     */
    private async processRestaurantCards(): Promise<void> {
        const cards = document.querySelectorAll(ZONE_SELECTORS.CARD);
        const cardArray = Array.from(cards);

        // Process sequentially
        for (const card of cardArray) {
            await this.handleCard(card);
        }
    }

    /**
     * Processes a single restaurant card.
     * @param card The card element to process.
     */
    private async handleCard(card: Element): Promise<void> {
        // Remove existing badge if present (user request)
        const existingBadge = card.querySelector(ZONE_SELECTORS.BADGE);
        if (existingBadge) {
            existingBadge.remove();
        }

        let zoneName: string | null = (card as HTMLElement).dataset.zoneName || null;

        // Try to find zone in dataset if not present
        if (!zoneName) {
            const manageBtn = card.querySelector<HTMLElement>('.owned-restaurant-card__manage-btn');
            if (manageBtn && manageBtn.dataset.restaurantThematisationZone) {
                zoneName = manageBtn.dataset.restaurantThematisationZone;
            }
        }

        const finalZoneName = zoneName || 'Sans zone';

        // Add to set and update dataset
        if (finalZoneName) {
            this._zones.add(finalZoneName);
        }
        (card as HTMLElement).dataset.zoneName = finalZoneName;
    }

    /**
     * Groups restaurants by their assigned zone.
     */
    private _groupRestaurants(): void {
        const cards = document.querySelectorAll(ZONE_SELECTORS.CARD);

        if (cards.length > 0) {
            const container = cards[0].parentElement;

            if (container) {
                const { groups, noZone } = this._getGroupedCards(cards);
                this._renderZoneGroups(container, groups, noZone);
            }
        }
    }

    /**
     * Helper to classify cards into groups.
     * @param cards NodeList of restaurant cards.
     * @returns Object containing grouped cards and cards with no zone (or 'Autre').
     */
    private _getGroupedCards(cards: NodeListOf<Element>): { groups: Record<string, HTMLElement[]>, noZone: HTMLElement[] } {
        const groups: Record<string, HTMLElement[]> = {};
        const noZone: HTMLElement[] = [];

        cards.forEach((card) => {
            const zone = (card as HTMLElement).dataset.zoneName;
            if (zone) {
                if (!groups[zone]) groups[zone] = [];
                groups[zone].push(card as HTMLElement);
            } else {
                noZone.push(card as HTMLElement);
            }
        });

        return { groups, noZone };
    }

    /**
     * Renders the grouped cards into the container.
     * @param container The container element.
     * @param groups The groups of cards.
     * @param noZone cards without valid zone.
     */
    private _renderZoneGroups(container: HTMLElement, groups: Record<string, HTMLElement[]>, noZone: HTMLElement[]): void {
        // Clear container (preserving elements in memory)
        container.innerHTML = '';

        // Sort and render groups
        Object.keys(groups).sort().forEach(zoneName => {
            const groupContainer = this._createZoneGroupElement(zoneName, groups[zoneName]);
            container.appendChild(groupContainer);
        });

        // Render no-zone items
        if (noZone.length > 0) {
            const noZoneContainer = createElement('div', { class: 'tpi-restaurant-no-zone-group' });
            noZone.forEach(card => noZoneContainer.appendChild(card));
            container.appendChild(noZoneContainer);
        }
    }

    /**
     * Creates a DOM element for a single zone group.
     * @param zoneName Name of the zone.
     * @param cards Array of cards in this zone.
     * @returns The constructed HTMLElement.
     */
    private _createZoneGroupElement(zoneName: string, cards: HTMLElement[]): HTMLElement {
        const groupContainer = createElement('div', {
            class: 'owned-attractions__zone-group tpi-restaurant-zone-group',
            'data-zone-name': zoneName
        });

        let backgroundStyle = '';
        if (zoneName === 'Sans zone') {
            backgroundStyle = 'background-color: rgba(53, 179, 175, 0.08);'; // Dark styling for no zone
        } else {
            const imageUrl = this._getZoneImage(zoneName);
            backgroundStyle = `background-image: url('${imageUrl}');`;
        }

        const header = createElement('div', {
            class: `${ZONE_SELECTORS.ZONE_HEADER} owned-attractions__zone-header`, // Keeping original class for potential other styles, plus new one
            style: backgroundStyle
        }, [
            createElement('div', { class: `${ZONE_SELECTORS.ZONE_HEADER_OVERLAY} owned-attractions__zone-header-overlay` }),
            createElement('div', { class: `${ZONE_SELECTORS.ZONE_HEADER_CONTENT} owned-attractions__zone-header-content` }, [
                createElement('h3', { class: `${ZONE_SELECTORS.ZONE_NAME} owned-attractions__zone-name` }, [zoneName])
            ])
        ]);

        const cardsContainer = createElement('div', {
            class: `${ZONE_SELECTORS.ZONE_ATTRACTIONS_CONTAINER} owned-attractions__zone-attractions`,
        });

        cards.forEach(card => cardsContainer.appendChild(card));

        groupContainer.appendChild(header);
        groupContainer.appendChild(cardsContainer);

        return groupContainer;
    }

    /**
     * Returns the image URL for a given zone.
     * @param zoneName The name of the zone.
     * @returns The URL string.
     */
    private _getZoneImage(zoneName: string): string {
        const normalized = zoneName.toLowerCase();
        let imageUrl = '';

        switch (true) {
            case normalized.includes('alpine'):
            case normalized.includes('aventure'):
                imageUrl = ZONE_IMAGES_URL.AVANTURE;
                break;

            case normalized.includes('amnétie'):
            case normalized.includes('futur'):
                imageUrl = ZONE_IMAGES_URL.FUTURISTE;
                break;

            case normalized.includes('fantasy'):
                imageUrl = ZONE_IMAGES_URL.FANTASY;
                break;

            case normalized.includes('pirate'):
                imageUrl = ZONE_IMAGES_URL.PIRATE;
                break;

            case normalized.includes('western'):
            case normalized.includes('farwest'):
                imageUrl = ZONE_IMAGES_URL.FARWEST;
                break;

            case normalized.includes('mythologie'):
                imageUrl = ZONE_IMAGES_URL.MYTHOLOGIE;
                break;

            case normalized.includes('conte'):
                imageUrl = ZONE_IMAGES_URL.CONTES;
                break;

            case normalized.includes('jungle'):
                imageUrl = ZONE_IMAGES_URL.JUNGLE;
                break;

            case normalized.includes('océan'):
            case normalized.includes('ocean'):
                imageUrl = ZONE_IMAGES_URL.OCEAN;
                break;

            case normalized.includes('horreur'):
                imageUrl = ZONE_IMAGES_URL.HORREUR;
                break;

            default:
                imageUrl = 'https://placehold.co/600x100/000000/FFFFFF/png?text=' + zoneName;
                break;
        }

        return imageUrl;
    }

    /**
     * Injects the filter UI into the page.
     */
    private _injectUI(): void {
        const container = this._getOrCreateContainer();

        if (container && !document.getElementById(ZONE_SELECTORS.FILTER_ID)) {
            this._filterGroup = this._createFilterGroup();

            // Append Zone Filter
            container.appendChild(this._filterGroup);

            // Create and Append Status Filter
            const statusFilterGroup = this._createStatusFilterGroup();
            if (this._filterGroup.nextSibling) {
                container.insertBefore(statusFilterGroup, this._filterGroup.nextSibling);
            } else {
                container.appendChild(statusFilterGroup);
            }

            // Inject Actions if missing
            if (!document.querySelector('.owned-attractions__filter-actions')) {
                const actionsDiv = this._createFilterActions();
                container.appendChild(actionsDiv);
            }

            this._setupInteractions();
            this._updateCounter();
        }
    }

    /**
     * Gets or creates the container for filters.
     * @returns The container element or null.
     */
    private _getOrCreateContainer(): Element | null {
        let container = document.querySelector(ZONE_SELECTORS.FILTER_CONTAINER) ||
            document.querySelector('.owned-attractions__filters-container');

        if (!container) {
            const header = document.querySelector('.restaurants-header');
            if (header) {
                container = createElement('div', {
                    class: 'owned-restaurants__filters-container',
                    style: { display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: 'auto' }
                });
                header.appendChild(container);
            } else {
                const section = document.querySelector('.owned-restaurants');
                if (section) {
                    container = createElement('div', {
                        class: 'owned-restaurants__filters-container',
                        style: { padding: '0 1rem', marginBottom: '1rem' }
                    });
                    const title = section.querySelector('.owned-restaurants__title');
                    if (title && title.nextSibling) {
                        section.insertBefore(container, title.nextSibling);

                    } else {
                        section.prepend(container);
                    }
                }
            }
        }

        return container;
    }

    /**
     * Creates the filter dropdown group.
     * @returns The filter group element.
     */
    private _createFilterGroup(): HTMLElement {
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

        return createElement(
            'div',
            {
                class: ZONE_SELECTORS.SITE_FILTER_GROUP,
            },
            [label, this._selectElement],
        );
    }

    /**
     * Creates the status filter dropdown group.
     * @returns The status filter group element.
     */
    private _createStatusFilterGroup(): HTMLElement {
        const label = createElement(
            'label',
            {
                for: ZONE_SELECTORS.STATUS_FILTER_ID,
                class: ZONE_SELECTORS.SITE_LABEL,
            },
            [STATUS_STRINGS.LABEL],
        );

        this._statusSelectElement = createElement('select', {
            id: ZONE_SELECTORS.STATUS_FILTER_ID,
            class: ZONE_SELECTORS.SITE_SELECT,
        });

        this._statusSelectElement.add(new Option(STATUS_STRINGS.DEFAULT_OPTION, ''));
        this._statusSelectElement.add(new Option(STATUS_STRINGS.OPEN, 'open'));
        this._statusSelectElement.add(new Option(STATUS_STRINGS.CLOSED, 'closed'));
        this._statusSelectElement.add(new Option(STATUS_STRINGS.WORK, 'work'));

        return createElement(
            'div',
            {
                class: ZONE_SELECTORS.SITE_FILTER_GROUP,
            },
            [label, this._statusSelectElement],
        );
    }

    /**
     * Creates the filter actions container (Counter + Reset).
     * @returns The actions element.
     */
    private _createFilterActions(): HTMLElement {
        return createElement('div', {
            class: `${ZONE_SELECTORS.FILTER_ACTIONS} owned-attractions__filter-actions`,
        }, [
            createElement('div', { class: 'owned-attractions__filter-count' }, [
                createElement('span', { id: 'owned-filter-count' }, ['0']),
                ' restaurant(s) affiché(s)'
            ]),
            createElement('button', {
                type: 'button',
                class: 'owned-attractions__filter-reset',
                id: 'owned-filter-reset-btn'
            }, ['Réinitialiser les filtres'])
        ]);
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
                    if (this._statusSelectElement) this._statusSelectElement.value = '';
                    this._applyFilter();
                });
            }
        }

        if (this._statusSelectElement) {
            this._statusSelectElement.addEventListener('change', () => {
                this._applyFilter();
            });
        }
    }

    /**
     * Applies the selected zone filter to the zone groups.
     */
    private _applyFilter(): void {
        const selectedZone = this._selectElement?.value || '';
        const selectedStatus = this._statusSelectElement?.value || '';
        const groups = document.querySelectorAll('.tpi-restaurant-zone-group');

        groups.forEach((group) => {
            const groupZone = (group as HTMLElement).dataset.zoneName || '';
            let hasVisibleChildren = false;

            // Process children
            const cards = group.querySelectorAll('.owned-restaurant-card');
            cards.forEach(card => {
                const cardStatus = this._getRestaurantStatus(card as HTMLElement);
                let isVisible = true;

                // Zone Check (Implicit by group, but safer to check if needed, mostly redundant due to group hiding optimization, but we need to hide individual cards if status doesn't match)
                // Actually, if we filter by status, we might hide some cards inside a visible zone.

                // Status Check
                if (selectedStatus && selectedStatus !== '') {
                    if (selectedStatus === 'work') {
                        if (!cardStatus.includes('travaux') && !cardStatus.includes('work')) isVisible = false;
                    } else if (selectedStatus === 'open') {
                        if (!cardStatus.includes('open') && !cardStatus.includes('ouvert') && !cardStatus.includes('assigné')) isVisible = false;
                    } else if (selectedStatus === 'closed') {
                        if (!cardStatus.includes('closed') && !cardStatus.includes('fermé') && !cardStatus.includes('ferme')) isVisible = false;
                    }
                }

                if (isVisible) {
                    (card as HTMLElement).style.display = '';
                    hasVisibleChildren = true;
                } else {
                    (card as HTMLElement).style.display = 'none';
                }
            });

            if ((selectedZone === '' || groupZone === selectedZone) && hasVisibleChildren) {
                group.classList.remove(ZONE_SELECTORS.HIDDEN_CLASS);
            } else {
                group.classList.add(ZONE_SELECTORS.HIDDEN_CLASS);
            }
        });

        // Handle no-zone elements
        const noZoneContainer = document.querySelector('.tpi-restaurant-no-zone-group');
        if (noZoneContainer) {
            let hasVisibleChildren = false;
            const cards = noZoneContainer.querySelectorAll('.owned-restaurant-card');
            cards.forEach(card => {
                const cardStatus = this._getRestaurantStatus(card as HTMLElement);
                let isVisible = true;

                if (selectedStatus && selectedStatus !== '') {
                    if (selectedStatus === 'work') {
                        if (!cardStatus.includes('travaux') && !cardStatus.includes('work')) isVisible = false;
                    } else if (selectedStatus === 'open') {
                        if (!cardStatus.includes('open') && !cardStatus.includes('ouvert') && !cardStatus.includes('assigné')) isVisible = false;
                    } else if (selectedStatus === 'closed') {
                        if (!cardStatus.includes('closed') && !cardStatus.includes('fermé') && !cardStatus.includes('ferme')) isVisible = false;
                    }
                }

                if (isVisible) {
                    (card as HTMLElement).style.display = '';
                    hasVisibleChildren = true;
                } else {
                    (card as HTMLElement).style.display = 'none';
                }
            });

            if (selectedZone === '' && hasVisibleChildren) {
                noZoneContainer.classList.remove(ZONE_SELECTORS.HIDDEN_CLASS);
            } else {
                noZoneContainer.classList.add(ZONE_SELECTORS.HIDDEN_CLASS);
            }
        }

        this._updateCounter();
    }

    /**
     * Helper to get restaurant status string.
     */
    private _getRestaurantStatus(el: HTMLElement): string {
        const statusText = el.querySelector('.owned-restaurant-card__status')?.textContent?.toLowerCase();
        if (statusText) return statusText;

        const toggle = el.querySelector('.owned-restaurant-card__toggle-input') as HTMLInputElement;
        if (toggle) {
            return toggle.checked ? 'open' : 'closed';
        }
        return '';
    }

    /**
     * Updates the visible restaurants counter.
     */
    private _updateCounter(): void {
        const counterEl = document.querySelector(ZONE_SELECTORS.COUNTER);
        const cards = document.querySelectorAll<HTMLElement>(ZONE_SELECTORS.CARD);

        if (counterEl) {
            let visibleCount = 0;

            cards.forEach((card) => {
                const parentGroup = card.closest('.owned-attractions__zone-group, .tpi-restaurant-no-zone-group');

                const isGroupHidden = parentGroup?.classList.contains(ZONE_SELECTORS.HIDDEN_CLASS);
                const isCardHidden = window.getComputedStyle(card).display === 'none';

                if (!isGroupHidden && !isCardHidden) {
                    visibleCount++;
                }
            });

            counterEl.textContent = visibleCount.toString();
        }
    }
}
