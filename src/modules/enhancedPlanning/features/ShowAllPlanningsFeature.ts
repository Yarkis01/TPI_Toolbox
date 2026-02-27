import { BaseFeature } from '../abstract/BaseFeature';
import { PLANNING_SELECTORS } from '../constants';
import { ILocationInfo, IPlanningData, IPlanningEmployee } from '../types';

// @ts-ignore
import styles from './showAllPlannings.scss?inline';
import { injectStyle } from '../../../utils/DomUtils';

/** Day keys used in planningData */
const DAY_KEYS = ['jour1', 'jour2', 'jour3', 'jour4', 'jour5'] as const;

const DAY_LABELS = ['Jour 1 (Semaine)', 'Jour 2 (Semaine)', 'Jour 3 (Semaine)', 'Jour 4 (Week-end)', 'Jour 5 (Week-end)'];

/** Mapping of employee type select values to their data keys in planningData */
const TYPE_MAPPING: Record<
    string,
    {
        employeesKey: keyof IPlanningData;
        locationsKey: keyof IPlanningData;
        locationLabel: string;
        locationMapper: (loc: Record<string, unknown>) => ILocationInfo;
    }
> = {
    vendeur: {
        employeesKey: 'vendeurs',
        locationsKey: 'boutiques',
        locationLabel: 'boutique',
        locationMapper: (b) => ({
            id: b.id as number,
            name: b.name as string,
            minEmployees: b.min_vendeur as number,
            maxEmployees: b.max_vendeur as number,
        }),
    },
    cuisinier: {
        employeesKey: 'cuisiniers',
        locationsKey: 'restaurants',
        locationLabel: 'restaurant',
        locationMapper: (r) => ({
            id: r.id as number,
            name: r.name as string,
            minEmployees: r.min_cuisinier as number,
            maxEmployees: r.max_cuisinier as number,
        }),
    },
    artiste: {
        employeesKey: 'artistes',
        locationsKey: 'spectacles',
        locationLabel: 'spectacle',
        locationMapper: (s) => ({
            id: s.id as number,
            name: s.name as string,
            minEmployees: s.min_artiste as number,
            maxEmployees: s.max_artiste as number,
        }),
    },
    operateur_attraction: {
        employeesKey: 'operateursAttraction',
        locationsKey: 'attractions',
        locationLabel: 'attraction',
        locationMapper: (a) => ({
            id: a.id as number,
            name: a.name as string,
            minEmployees: a.operateur_minimum as number,
            maxEmployees: a.operateur_maximum as number,
        }),
    },
};

/**
 * ShowAllPlanningsFeature
 * Adds a button to display all plannings for the selected employee type at once,
 * reading directly from the page's planningData script.
 * Uses the game's native CSS classes for seamless integration.
 */
export class ShowAllPlanningsFeature extends BaseFeature {
    private _btn: HTMLButtonElement | null = null;
    private _container: HTMLElement | null = null;
    private _originalContent: HTMLElement | null = null;
    private _isShowingAll: boolean = false;
    private _typeChangeListener: (() => void) | null = null;
    private _secondaryChangeListeners: { select: HTMLSelectElement; listener: () => void }[] = [];

    public get id(): string {
        return 'show_all_plannings';
    }

    public get name(): string {
        return 'Afficher tous les plannings';
    }

    public get description(): string {
        return "Affiche tous les plannings du type d'employé sélectionné en une seule vue.";
    }

    protected onEnable(): void {
        injectStyle(styles);
        this._injectButton();
        this._listenTypeChange();
        this._listenSecondaryChanges();
    }

    protected onDisable(): void {
        this._hideAllPlannings();
        this._btn?.remove();
        this._btn = null;

        if (this._typeChangeListener) {
            const typeSelect = document.querySelector<HTMLSelectElement>(
                PLANNING_SELECTORS.TYPE_SELECT,
            );
            typeSelect?.removeEventListener('change', this._typeChangeListener);
            this._typeChangeListener = null;
        }

        for (const { select, listener } of this._secondaryChangeListeners) {
            select.removeEventListener('change', listener);
        }
        this._secondaryChangeListeners = [];
    }

    /**
     * Listens to employee type changes to reset the view.
     */
    private _listenTypeChange(): void {
        const typeSelect = document.querySelector<HTMLSelectElement>(
            PLANNING_SELECTORS.TYPE_SELECT,
        );
        if (!typeSelect) return;

        this._typeChangeListener = () => {
            if (this._isShowingAll) {
                this._hideAllPlannings();
            }
            this._updateButtonVisibility(typeSelect.value);
        };

        typeSelect.addEventListener('change', this._typeChangeListener);
        this._updateButtonVisibility(typeSelect.value);
    }

    /**
     * Listens for changes on secondary selects (boutique, restaurant, etc.)
     * to reset state when the user picks a specific one while in "show all" mode.
     */
    private _listenSecondaryChanges(): void {
        const secondaryIds = [
            PLANNING_SELECTORS.BOUTIQUE_SELECT,
            PLANNING_SELECTORS.RESTAURANT_SELECT,
            PLANNING_SELECTORS.SPECTACLE_SELECT,
            PLANNING_SELECTORS.ATTRACTION_SELECT,
        ];

        for (const id of secondaryIds) {
            const select = document.querySelector<HTMLSelectElement>(id);
            if (!select) continue;

            const listener = () => {
                if (this._isShowingAll) {
                    this._resetState();
                }
            };

            select.addEventListener('change', listener);
            this._secondaryChangeListeners.push({ select, listener });
        }
    }

    /**
     * Resets internal state without restoring the original content.
     * Used when the game's JS has already replaced the content area
     * (e.g. when the user picks a specific restaurant from the dropdown).
     */
    private _resetState(): void {
        this._container = null;
        this._originalContent = null;
        this._isShowingAll = false;

        if (this._btn) {
            this._btn.classList.remove('show-all-plannings__btn--active');
            this._btn.textContent = '📋 Afficher tous les plannings';
        }
    }

    /**
     * Shows/hides the button based on whether the selected type supports "show all".
     */
    private _updateButtonVisibility(selectedType: string): void {
        if (this._btn) {
            this._btn.style.display = selectedType in TYPE_MAPPING ? '' : 'none';
        }
    }

    /**
     * Injects the "Show all plannings" toggle button.
     */
    private _injectButton(): void {
        const filters = document.querySelector(PLANNING_SELECTORS.FILTERS);
        if (!filters) return;

        this._btn = document.createElement('button');
        this._btn.type = 'button';
        this._btn.className = 'show-all-plannings__btn';
        this._btn.textContent = '📋 Afficher tous les plannings';
        this._btn.addEventListener('click', () => this._toggleAllPlannings());

        filters.appendChild(this._btn);

        // Check initial visibility
        const typeSelect = document.querySelector<HTMLSelectElement>(
            PLANNING_SELECTORS.TYPE_SELECT,
        );
        if (typeSelect) {
            this._updateButtonVisibility(typeSelect.value);
        }
    }

    /**
     * Toggles between showing all plannings and the normal view.
     */
    private _toggleAllPlannings(): void {
        if (this._isShowingAll) {
            this._hideAllPlannings();
        } else {
            this._showAllPlannings();
        }
    }

    /**
     * Builds and displays all planning tables using the game's native CSS.
     */
    private _showAllPlannings(): void {
        const planningData = this._getPlanningData();
        if (!planningData) {
            this._logger.error('planningData not found in page scripts');
            return;
        }

        const typeSelect = document.querySelector<HTMLSelectElement>(
            PLANNING_SELECTORS.TYPE_SELECT,
        );
        if (!typeSelect) return;

        const mapping = TYPE_MAPPING[typeSelect.value];
        if (!mapping) return;

        const employees = planningData[mapping.employeesKey] as IPlanningEmployee[];
        const rawLocations = planningData[mapping.locationsKey] as unknown as Record<string, unknown>[];
        const locations = rawLocations.map(mapping.locationMapper);
        const nextDay = planningData.nextDay;

        // Save original content
        const resultContent = document.querySelector<HTMLElement>(PLANNING_SELECTORS.PLANNING_RESULT);
        if (!resultContent) return;

        this._originalContent = resultContent.cloneNode(true) as HTMLElement;

        // Build the all-plannings view
        this._container = document.createElement('div');
        this._container.className = 'planning-result__content';

        for (const location of locations) {
            const section = this._buildLocationSection(location, employees, nextDay, mapping.locationLabel);
            this._container.appendChild(section);
        }

        // Replace content
        resultContent.innerHTML = '';
        resultContent.appendChild(this._container);

        // Update button state
        this._isShowingAll = true;
        if (this._btn) {
            this._btn.classList.add('show-all-plannings__btn--active');
            this._btn.textContent = '↩ Revenir à la vue normale';
        }
    }

    /**
     * Restores the original single-planning view.
     */
    private _hideAllPlannings(): void {
        if (!this._isShowingAll) return;

        const resultContent = document.querySelector<HTMLElement>(PLANNING_SELECTORS.PLANNING_RESULT);
        if (resultContent && this._originalContent) {
            resultContent.innerHTML = this._originalContent.innerHTML;
        }

        this._container = null;
        this._originalContent = null;
        this._isShowingAll = false;

        if (this._btn) {
            this._btn.classList.remove('show-all-plannings__btn--active');
            this._btn.textContent = '📋 Afficher tous les plannings';
        }
    }

    /**
     * Builds a planning section for a single location using the game's native CSS classes.
     */
    private _buildLocationSection(
        location: ILocationInfo,
        allEmployees: IPlanningEmployee[],
        nextDay: number,
        locationLabel: string,
    ): HTMLElement {
        const wrap = document.createElement('div');
        wrap.className = 'planning-grid-wrap';

        // Title — same style as the game's "Planning du spectacle : <strong>Name</strong>"
        const title = document.createElement('p');
        title.className = 'planning-cuisinier-restaurant-title';
        title.innerHTML = `Planning ${locationLabel} : <strong>${location.name}</strong> — Min ${location.minEmployees} / Max ${location.maxEmployees}`;
        wrap.appendChild(title);

        // Filter employees assigned to this location on at least one day
        const assignedEmployees = allEmployees.filter((emp) =>
            DAY_KEYS.some((day) => emp.lieu_planning[day] === location.id),
        );

        if (assignedEmployees.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'planning-grid__empty';
            empty.textContent = 'Aucun employé assigné à ce lieu.';
            wrap.appendChild(empty);
            return wrap;
        }

        // Table using game's .planning-grid classes
        const table = document.createElement('table');
        table.className = 'planning-grid planning-grid--by-day';
        table.setAttribute('role', 'grid');

        // Thead
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const nameHeader = document.createElement('th');
        nameHeader.className = 'planning-grid__cell planning-grid__cell--label';
        nameHeader.textContent = 'Employé';
        headerRow.appendChild(nameHeader);

        DAY_KEYS.forEach((_, i) => {
            const th = document.createElement('th');
            th.className = 'planning-grid__cell planning-grid__cell--day';
            if (i + 1 === nextDay) {
                th.classList.add('planning-grid__cell--next-day');
            }
            th.setAttribute('scope', 'col');

            // Day label + capacity count
            const count = assignedEmployees.filter(
                (emp) => emp.lieu_planning[DAY_KEYS[i]] === location.id,
            ).length;

            const labelSpan = document.createElement('span');
            labelSpan.className = 'planning-grid__day-label';
            labelSpan.textContent = DAY_LABELS[i];

            if (i + 1 === nextDay) {
                const pill = document.createElement('span');
                pill.className = 'planning-next-day-pill';
                pill.title = 'Prochain jour de simulation';
                pill.setAttribute('aria-hidden', 'true');
                labelSpan.appendChild(pill);
            }

            th.appendChild(labelSpan);
            th.appendChild(document.createElement('br'));

            const capacitySpan = document.createElement('span');
            capacitySpan.className = 'planning-grid__day-capacity';

            const countSpan = document.createElement('span');
            countSpan.className = `planning-grid__day-maintainable ${count >= location.minEmployees
                ? 'planning-grid__day-maintainable--ok'
                : 'planning-grid__day-maintainable--short'
                }`;
            countSpan.textContent = String(count);

            capacitySpan.textContent = 'Assignés : ';
            capacitySpan.appendChild(countSpan);
            capacitySpan.appendChild(
                document.createTextNode(` / ${location.minEmployees}-${location.maxEmployees}`),
            );

            th.appendChild(capacitySpan);
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Tbody
        const tbody = document.createElement('tbody');

        const sortedEmployees = [...assignedEmployees].sort((a, b) =>
            a.name.localeCompare(b.name),
        );

        for (const emp of sortedEmployees) {
            const row = document.createElement('tr');

            // Check if employee is fully assigned to this location on all working days
            const isFullRow = DAY_KEYS.every(
                (day) =>
                    emp.lieu_planning[day] === location.id || emp.lieu_planning[day] === 0,
            );
            if (isFullRow) {
                row.className = 'planning-grid__row--full';
            }

            const nameCell = document.createElement('th');
            nameCell.className = 'planning-grid__cell planning-grid__cell--label';
            nameCell.setAttribute('scope', 'row');

            const costSpan = document.createElement('span');
            costSpan.className = 'planning-grid__cost';
            costSpan.textContent = `${emp.salaire} €/sem`;

            nameCell.textContent = emp.name + ' ';
            nameCell.appendChild(costSpan);
            row.appendChild(nameCell);

            DAY_KEYS.forEach((day) => {
                const td = document.createElement('td');
                td.setAttribute('role', 'gridcell');
                const assignedLocationId = emp.lieu_planning[day];

                if (assignedLocationId === location.id) {
                    td.className =
                        'planning-grid__cell planning-grid__day-cell planning-grid__day-cell--set planning-grid__day-cell--this-restaurant';
                    td.textContent = '✅';
                } else if (assignedLocationId && assignedLocationId !== 0) {
                    td.className =
                        'planning-grid__cell planning-grid__day-cell planning-grid__day-cell--set planning-grid__day-cell--other-restaurant';
                    td.textContent = 'Autre';
                } else {
                    td.className =
                        'planning-grid__cell planning-grid__day-cell planning-grid__day-cell--blocked';
                    td.textContent = '—';
                }

                row.appendChild(td);
            });

            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        wrap.appendChild(table);

        return wrap;
    }

    /**
     * Reads planningData from the page's live window object via unsafeWindow.
     * This ensures we always get the current data, even after the user
     * has modified employee assignments.
     */
    private _getPlanningData(): IPlanningData | null {
        try {
            const pageWindow = unsafeWindow as unknown as { planningData?: IPlanningData };
            if (pageWindow.planningData && typeof pageWindow.planningData === 'object') {
                return pageWindow.planningData;
            }
        } catch (e) {
            this._logger.error(`Failed to read planningData: ${(e as Error).message}`);
        }

        return null;
    }
}
