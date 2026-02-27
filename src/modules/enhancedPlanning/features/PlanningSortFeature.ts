import { BaseFeature } from '../abstract/BaseFeature';
import { PLANNING_SELECTORS } from '../constants';
import { StorageService } from '../../../services/StorageService';

/** Sort modes available */
type SortMode = 'name' | 'assignments-asc' | 'assignments-desc';

const STORAGE_KEY = 'planning_sort_mode';

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
    { mode: 'name', label: 'Nom (A-Z)' },
    { mode: 'assignments-asc', label: 'Affectations ↑ (croissant)' },
    { mode: 'assignments-desc', label: 'Affectations ↓ (décroissant)' },
];

/**
 * PlanningSortFeature
 * Adds a sort combobox in the filters bar to sort employee rows
 * by name or by number of assigned days (ascending/descending).
 * Uses the game's native CSS classes for the select element.
 */
export class PlanningSortFeature extends BaseFeature {
    private _wrapper: HTMLElement | null = null;
    private _select: HTMLSelectElement | null = null;
    private _observer: MutationObserver | null = null;
    private _currentSort: SortMode;

    constructor() {
        super();
        this._currentSort = StorageService.getInstance().load<SortMode>(STORAGE_KEY, 'name');
    }

    public get id(): string {
        return 'planning_sort';
    }

    public get name(): string {
        return 'Tri du planning';
    }

    public get description(): string {
        return 'Permet de trier les employés du planning par nom ou par nombre d\'affectations.';
    }

    protected onEnable(): void {
        this._injectSelect();
        this._observeResultChanges();
        // Apply saved sort immediately if a table is already visible
        this._applySort(this._currentSort);
    }

    protected onDisable(): void {
        this._wrapper?.remove();
        this._wrapper = null;
        this._select = null;
        this._observer?.disconnect();
        this._observer = null;
    }

    /**
     * Observes the result area to re-apply sort when a new table loads.
     */
    private _observeResultChanges(): void {
        const resultContainer = document.querySelector(PLANNING_SELECTORS.PLANNING_RESULT);
        if (!resultContainer) return;

        this._observer = new MutationObserver(() => {
            // Re-apply current sort when the table content changes
            const table = document.querySelector(PLANNING_SELECTORS.PLANNING_GRID);
            if (table) {
                this._applySort(this._currentSort);
            }
        });

        this._observer.observe(resultContainer, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Injects the sort combobox into the filters bar, using the game's styling.
     */
    private _injectSelect(): void {
        const filters = document.querySelector(PLANNING_SELECTORS.FILTERS);
        if (!filters) return;

        // Don't inject if already present
        if (filters.querySelector('#planning-sort-select')) return;

        // Build wrapper row matching the game's layout
        this._wrapper = document.createElement('div');
        this._wrapper.className = 'planning-filters__row';

        const label = document.createElement('label');
        label.className = 'planning-filters__label';
        label.htmlFor = 'planning-sort-select';
        label.textContent = 'Trier par';

        this._select = document.createElement('select');
        this._select.id = 'planning-sort-select';
        this._select.className = 'planning-filters__select';
        this._select.name = 'planning_sort';

        for (const { mode, label: optLabel } of SORT_OPTIONS) {
            const option = document.createElement('option');
            option.value = mode;
            option.textContent = optLabel;
            if (mode === this._currentSort) {
                option.selected = true;
            }
            this._select.appendChild(option);
        }

        this._select.addEventListener('change', () => {
            this._currentSort = this._select!.value as SortMode;
            StorageService.getInstance().save(STORAGE_KEY, this._currentSort);
            this._applySort(this._currentSort);
        });

        this._wrapper.appendChild(label);
        this._wrapper.appendChild(this._select);

        // Insert before the "show all plannings" button if present, otherwise append
        const showAllBtn = filters.querySelector('.show-all-plannings__btn');
        if (showAllBtn) {
            filters.insertBefore(this._wrapper, showAllBtn);
        } else {
            filters.appendChild(this._wrapper);
        }
    }

    /**
     * Applies the selected sort to the planning grid table.
     */
    private _applySort(mode: SortMode): void {
        const table = document.querySelector<HTMLTableElement>(PLANNING_SELECTORS.PLANNING_GRID);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) return;

        rows.sort((a, b) => {
            switch (mode) {
                case 'name':
                    return this._getEmployeeName(a).localeCompare(this._getEmployeeName(b));

                case 'assignments-asc':
                case 'assignments-desc': {
                    const dayA = this._getFirstAssignedDay(a);
                    const dayB = this._getFirstAssignedDay(b);
                    const assignedA = dayA <= 5;
                    const assignedB = dayB <= 5;

                    // Unassigned always last
                    if (assignedA && !assignedB) return -1;
                    if (!assignedA && assignedB) return 1;
                    if (!assignedA && !assignedB) return 0;

                    // Both assigned: sort by first day
                    return mode === 'assignments-asc'
                        ? dayA - dayB
                        : dayB - dayA;
                }

                default:
                    return 0;
            }
        });

        // Temporarily disconnect observer to avoid re-triggering during sort
        this._observer?.disconnect();

        for (const row of rows) {
            tbody.appendChild(row);
        }

        // Reconnect observer
        const resultContainer = document.querySelector(PLANNING_SELECTORS.PLANNING_RESULT);
        if (resultContainer && this._observer) {
            this._observer.observe(resultContainer, {
                childList: true,
                subtree: true,
            });
        }
    }

    /**
     * Gets the employee name from a table row.
     */
    private _getEmployeeName(row: HTMLTableRowElement): string {
        const labelCell = row.querySelector('.planning-grid__cell--label');
        if (!labelCell) return '';

        // The text content includes the cost span, so we need just the first text node
        const textNodes = Array.from(labelCell.childNodes).filter(
            (n) => n.nodeType === Node.TEXT_NODE,
        );
        return textNodes.map((n) => n.textContent?.trim() ?? '').join('');
    }

    /**
     * Gets the first assigned day number for the employee in this row.
     * First checks for `--this-restaurant` cells (location-based types like
     * cuisiniers, vendeurs, artistes, opérateurs d'attraction).
     * Falls back to `--set` cells (global types like techniciens, agents de sécurité,
     * opérateurs de guichet) when no location-specific assignment exists.
     * Returns 6 if unassigned (sorts after j5).
     */
    private _getFirstAssignedDay(row: HTMLTableRowElement): number {
        // Try location-specific assignments first
        let assignedCells = row.querySelectorAll(
            '.planning-grid__day-cell--this-restaurant',
        );

        // Fallback to any assigned cell (for types without a specific location)
        if (assignedCells.length === 0) {
            assignedCells = row.querySelectorAll(
                '.planning-grid__day-cell--set',
            );
        }

        if (assignedCells.length === 0) return 6; // Unassigned: after j5

        let minDay = 6;
        for (const cell of assignedCells) {
            const day = parseInt((cell as HTMLElement).dataset.day ?? '6', 10);
            if (day < minDay) minDay = day;
        }
        return minDay;
    }
}
