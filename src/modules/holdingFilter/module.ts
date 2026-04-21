import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { PAGE_URL, SELECTORS, STAT_LABELS } from './constants';
import './styles.scss';

interface HoldingStats {
    redevance: number;
    partSocial: number;
    niveau: number;
}

interface FilterField {
    id: string;
    label: string;
    type: 'text' | 'number';
    placeholder: string;
}

const FILTER_FIELDS: FilterField[] = [
    { id: 'tpi-hf-name', label: 'Recherche', type: 'text', placeholder: 'Nom de la holding...' },
    { id: 'tpi-hf-redevance', label: 'Redevance max (%)', type: 'number', placeholder: '100' },
    { id: 'tpi-hf-part-social', label: 'Part sociale max (%)', type: 'number', placeholder: '100' },
    { id: 'tpi-hf-niveau', label: 'Niveau min', type: 'number', placeholder: '1' },
];

export class HoldingFilterModule extends BaseModule {
    private _filterBar: HTMLElement | null = null;
    private _boundFilter = this._applyFilters.bind(this);

    /** @inheritdoc */
    public get id(): string {
        return 'holding_filter';
    }

    /** @inheritdoc */
    public get name(): string {
        return 'Filtre des holdings';
    }

    /** @inheritdoc */
    public get description(): string {
        return 'Ajoute des filtres sur la page de recrutement des holdings pour trouver rapidement celle qui correspond à vos critères (redevance, part sociale, niveau...).';
    }

    /** @inheritdoc */
    public override canRunOnPage(url: string): boolean {
        return url.includes(PAGE_URL);
    }

    /** @inheritdoc */
    public getConfigSchema(): IModuleConfigSchema {
        return { options: [] };
    }

    /** @inheritdoc */
    protected onEnable(): void {
        this._injectFilterBar();
    }

    /** @inheritdoc */
    protected onDisable(): void {
        this._filterBar?.remove();
        this._filterBar = null;
        document.querySelectorAll<HTMLElement>(SELECTORS.CARD).forEach(c => (c.style.display = ''));
        document.getElementById(SELECTORS.NO_RESULTS_ID)?.remove();
    }

    /** Injects the filter bar before the holding card list. */
    private _injectFilterBar(): void {
        const list = document.querySelector(SELECTORS.CARD_LIST);
        if (!list) return;

        this._filterBar = document.createElement('div');
        this._filterBar.id = SELECTORS.FILTER_BAR_ID;

        const filtersRow = document.createElement('div');
        filtersRow.className = 'tpi-holding-filters';

        for (const field of FILTER_FIELDS) {
            const group = document.createElement('div');
            group.className = 'tpi-holding-filter-group';

            const label = document.createElement('label');
            label.htmlFor = field.id;
            label.textContent = field.label;

            const input = document.createElement('input');
            input.type = field.type;
            input.id = field.id;
            input.placeholder = field.placeholder;
            if (field.type === 'number') {
                input.min = '0';
            }

            group.appendChild(label);
            group.appendChild(input);
            filtersRow.appendChild(group);
        }

        this._filterBar.appendChild(filtersRow);
        list.before(this._filterBar);
        this._filterBar.addEventListener('input', this._boundFilter);
    }

    /** Filters the holding cards based on current input values. */
    private _applyFilters(): void {
        const name = (document.getElementById('tpi-hf-name') as HTMLInputElement).value.toLowerCase().trim();
        const maxRedevance = parseFloat((document.getElementById('tpi-hf-redevance') as HTMLInputElement).value);
        const maxPartSocial = parseFloat((document.getElementById('tpi-hf-part-social') as HTMLInputElement).value);
        const minNiveau = parseFloat((document.getElementById('tpi-hf-niveau') as HTMLInputElement).value);

        let visibleCount = 0;

        document.querySelectorAll<HTMLElement>(SELECTORS.CARD).forEach(card => {
            const cardName = card.querySelector(SELECTORS.CARD_HEAD)?.textContent?.toLowerCase() ?? '';
            const stats = this._parseStats(card);

            const passes =
                (!name || cardName.includes(name)) &&
                (isNaN(maxRedevance) || stats.redevance <= maxRedevance) &&
                (isNaN(maxPartSocial) || stats.partSocial <= maxPartSocial) &&
                (isNaN(minNiveau) || stats.niveau >= minNiveau);

            card.style.display = passes ? '' : 'none';
            if (passes) visibleCount++;
        });

        const list = document.querySelector(SELECTORS.CARD_LIST);
        let noResults = document.getElementById(SELECTORS.NO_RESULTS_ID);

        if (visibleCount === 0 && list) {
            if (!noResults) {
                noResults = document.createElement('p');
                noResults.id = SELECTORS.NO_RESULTS_ID;
                noResults.className = 'tpi-holding-no-results';
                noResults.textContent = 'Aucune holding ne correspond à vos critères.';
                list.appendChild(noResults);
            }
        } else {
            noResults?.remove();
        }
    }

    /** Parses the KPI stats from a holding card element. */
    private _parseStats(card: HTMLElement): HoldingStats {
        const stats: HoldingStats = { redevance: 0, partSocial: 0, niveau: 0 };

        card.querySelectorAll(SELECTORS.STAT_ITEM).forEach(item => {
            const label = item.querySelector(SELECTORS.STAT_LABEL)?.textContent?.trim() ?? '';
            const value = parseFloat(
                item.querySelector(SELECTORS.STAT_VALUE)?.textContent?.replace('%', '').trim() ?? '0',
            );

            if (label === STAT_LABELS.REDEVANCE) stats.redevance = value;
            else if (label === STAT_LABELS.PART_SOCIAL) stats.partSocial = value;
            else if (label === STAT_LABELS.NIVEAU) stats.niveau = value;
        });

        return stats;
    }
}
