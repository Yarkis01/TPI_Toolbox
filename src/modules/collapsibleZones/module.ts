import { BaseModule } from '../../core/abstract/BaseModule';
import { COLLAPSE_SELECTORS, STORAGE_KEYS } from './constants';
import './styles.scss';

/**
 * Module to allow collapsing zone sections.
 */
export class CollapsibleZonesModule extends BaseModule {
    private _collapsedZones: Set<string> = new Set();
    private _listeners: Map<HTMLElement, () => void> = new Map();

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'collapsible_zones';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Zones Repliables';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Permet de replier les zones pour gagner de la place et mieux naviguer.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (this._isTargetPage()) {
            this._loadState();
            this._setupCollapsibles();
        }
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._listeners.forEach((listener, element) => {
            element.removeEventListener('click', listener);
        });
        this._listeners.clear();

        document.querySelectorAll(COLLAPSE_SELECTORS.ZONE_GROUP).forEach((group) => {
            group.classList.remove(COLLAPSE_SELECTORS.COLLAPSED_CLASS);
        });
    }

    /**
     * Checks if the current page is the target page.
     */
    private _isTargetPage(): boolean {
        return document.location.href.includes(COLLAPSE_SELECTORS.PAGE_MATCH);
    }

    /**
     * Loads the collapsed state from local storage.
     */
    private _loadState(): void {
        const stored = localStorage.getItem(STORAGE_KEYS.COLLAPSED_ZONES);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this._collapsedZones = new Set(parsed);
                }
            } catch (e) {
                console.error('Failed to parse collapsed zones state', e);
            }
        }
    }

    /**
     * Saves the collapsed state to local storage.
     */
    private _saveState(): void {
        localStorage.setItem(
            STORAGE_KEYS.COLLAPSED_ZONES,
            JSON.stringify(Array.from(this._collapsedZones)),
        );
    }

    /**
     * Sets up the collapsible behavior for each zone.
     */
    private _setupCollapsibles(): void {
        const groups = document.querySelectorAll<HTMLElement>(COLLAPSE_SELECTORS.ZONE_GROUP);

        groups.forEach((group) => {
            const header = group.querySelector<HTMLElement>(COLLAPSE_SELECTORS.ZONE_HEADER);
            if (!header) return;

            // Get zone identifier (name)
            const zoneName = group.querySelector('.owned-attractions__zone-name')?.textContent?.trim() || '';
            if (!zoneName) return;

            // Apply initial state
            if (this._collapsedZones.has(zoneName)) {
                group.classList.add(COLLAPSE_SELECTORS.COLLAPSED_CLASS);
            }

            // check if listener already exists to avoid duplicates if re-enabled? 
            // BaseModule usually handles this but good to be safe.
            // Here we just add a new one as onDisable cleans up.

            const listener = () => {
                const isCollapsed = group.classList.toggle(COLLAPSE_SELECTORS.COLLAPSED_CLASS);
                if (isCollapsed) {
                    this._collapsedZones.add(zoneName);
                } else {
                    this._collapsedZones.delete(zoneName);
                }
                this._saveState();
            };

            header.addEventListener('click', listener);
            this._listeners.set(header, listener);
        });
    }
}
