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

interface SortField {
    id: string;
    label: string;
    stat: keyof HoldingStats;
}

const FILTER_FIELDS: FilterField[] = [
    { id: 'tpi-hf-name', label: 'Recherche', type: 'text', placeholder: 'Nom de la holding...' },
    {
        id: 'tpi-hf-redevance',
        label: 'Redevance max (%)',
        type: 'number',
        placeholder: 'Sans limite',
    },
    {
        id: 'tpi-hf-part-social',
        label: 'Part sociale max (%)',
        type: 'number',
        placeholder: 'Sans limite',
    },
    { id: 'tpi-hf-niveau', label: 'Niveau min', type: 'number', placeholder: 'Tous' },
];

const SORT_FIELDS: SortField[] = [
    { id: 'tpi-hf-sort-niveau', label: 'Trier : Niveau', stat: 'niveau' },
    { id: 'tpi-hf-sort-redevance', label: 'Trier : Redevance', stat: 'redevance' },
    { id: 'tpi-hf-sort-part', label: 'Trier : Part social', stat: 'partSocial' },
];

const SORT_OPTIONS = [
    { value: 'none', label: 'Aucun tri' },
    { value: 'asc', label: 'Croissant' },
    { value: 'desc', label: 'Décroissant' },
] as const;

export class HoldingFilterModule extends BaseModule {
    private _filterBar: HTMLElement | null = null;
    private _countEl: HTMLElement | null = null;
    private _boundFilter = this._applyFilters.bind(this);
    private _originalCardOrder: HTMLElement[] = [];

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
        this._countEl = null;

        const nativeFilters = document.querySelector<HTMLElement>(SELECTORS.NATIVE_FILTERS);
        if (nativeFilters) nativeFilters.style.display = '';

        const list = document.querySelector(SELECTORS.CARD_LIST);
        if (list) this._originalCardOrder.forEach((card) => list.appendChild(card));
        this._originalCardOrder = [];

        document
            .querySelectorAll<HTMLElement>(SELECTORS.CARD)
            .forEach((c) => (c.style.display = ''));
        document.getElementById(SELECTORS.NO_RESULTS_ID)?.remove();
    }

    /** Injects the filter bar before the holding card list. */
    private _injectFilterBar(): void {
        const list = document.querySelector(SELECTORS.CARD_LIST);
        if (!list) return;

        this._originalCardOrder = Array.from(
            document.querySelectorAll<HTMLElement>(SELECTORS.CARD),
        );

        const nativeFilters = document.querySelector<HTMLElement>(SELECTORS.NATIVE_FILTERS);
        if (nativeFilters) nativeFilters.style.display = 'none';

        this._filterBar = document.createElement('section');
        this._filterBar.id = SELECTORS.FILTER_BAR_ID;
        this._filterBar.className = 'dash-block dash-block--teal';

        const body = document.createElement('div');
        body.className = 'dash-block__body tpi-hf-body';
        this._filterBar.appendChild(body);

        const grid = document.createElement('div');
        grid.className = 'tpi-hf-grid';

        for (const field of FILTER_FIELDS) {
            const label = document.createElement('label');
            label.className = 'tpi-hf-label';
            label.htmlFor = field.id;
            label.textContent = field.label;

            const input = document.createElement('input');
            input.className = 'tpi-hf-input';
            input.type = field.type;
            input.id = field.id;
            input.placeholder = field.placeholder;
            if (field.type === 'number') input.min = '0';

            label.appendChild(input);
            grid.appendChild(label);
        }

        for (const field of SORT_FIELDS) {
            const label = document.createElement('label');
            label.className = 'tpi-hf-label';
            label.htmlFor = field.id;
            label.textContent = field.label;

            const select = document.createElement('select');
            select.className = 'tpi-hf-select';
            select.id = field.id;

            for (const opt of SORT_OPTIONS) {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            }

            label.appendChild(select);
            grid.appendChild(label);
        }

        const totalCards = document.querySelectorAll(SELECTORS.CARD).length;

        const actions = document.createElement('div');
        actions.className = 'tpi-hf-actions';

        this._countEl = document.createElement('span');
        this._countEl.id = SELECTORS.COUNT_ID;
        const bold = document.createElement('strong');
        bold.textContent = String(totalCards);
        this._countEl.appendChild(bold);
        this._countEl.append(' holding(s)');

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'tpi-hf-reset-btn';
        resetBtn.textContent = 'Réinitialiser';
        resetBtn.addEventListener('click', () => {
            grid.querySelectorAll<HTMLInputElement>('input').forEach((input) => (input.value = ''));
            grid
                .querySelectorAll<HTMLSelectElement>('select')
                .forEach((select) => (select.value = 'none'));
            this._applyFilters();
        });

        actions.appendChild(this._countEl);
        actions.appendChild(resetBtn);

        body.appendChild(grid);
        body.appendChild(actions);

        list.before(this._filterBar);
        grid.addEventListener('input', this._boundFilter);
        grid.addEventListener('change', this._boundFilter);
    }

    /** Filters and sorts the holding cards based on current input values. */
    private _applyFilters(): void {
        const name = (document.getElementById('tpi-hf-name') as HTMLInputElement).value
            .toLowerCase()
            .trim();
        const maxRedevance = parseFloat(
            (document.getElementById('tpi-hf-redevance') as HTMLInputElement).value,
        );
        const maxPartSocial = parseFloat(
            (document.getElementById('tpi-hf-part-social') as HTMLInputElement).value,
        );
        const minNiveau = parseFloat(
            (document.getElementById('tpi-hf-niveau') as HTMLInputElement).value,
        );

        const sorts: { stat: keyof HoldingStats; dir: string }[] = SORT_FIELDS.map((field) => ({
            stat: field.stat,
            dir: (document.getElementById(field.id) as HTMLSelectElement).value,
        }));

        const cardData = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.CARD)).map(
            (card) => ({
                el: card,
                cardName: card.querySelector(SELECTORS.CARD_HEAD)?.textContent?.toLowerCase() ?? '',
                stats: this._parseStats(card),
            }),
        );

        const visible: typeof cardData = [];
        const hidden: typeof cardData = [];

        for (const card of cardData) {
            const passes =
                (!name || card.cardName.includes(name)) &&
                (isNaN(maxRedevance) || card.stats.redevance <= maxRedevance) &&
                (isNaN(maxPartSocial) || card.stats.partSocial <= maxPartSocial) &&
                (isNaN(minNiveau) || card.stats.niveau >= minNiveau);

            card.el.style.display = passes ? '' : 'none';
            (passes ? visible : hidden).push(card);
        }

        visible.sort((a, b) => {
            for (const s of sorts) {
                if (s.dir === 'none') continue;
                const diff = a.stats[s.stat] - b.stats[s.stat];
                if (diff !== 0) return s.dir === 'asc' ? diff : -diff;
            }
            return 0;
        });

        const list = document.querySelector(SELECTORS.CARD_LIST);
        if (list) [...visible, ...hidden].forEach((d) => list.appendChild(d.el));

        if (this._countEl) {
            const bold = this._countEl.querySelector('strong');
            if (bold) bold.textContent = String(visible.length);
        }

        let noResults = document.getElementById(SELECTORS.NO_RESULTS_ID);

        if (visible.length === 0 && list) {
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

        card.querySelectorAll(SELECTORS.STAT_ITEM).forEach((item) => {
            const label = item.querySelector(SELECTORS.STAT_LABEL)?.textContent?.trim() ?? '';
            const value = parseFloat(
                item.querySelector(SELECTORS.STAT_VALUE)?.textContent?.replace('%', '').trim() ??
                    '0',
            );

            if (label === STAT_LABELS.REDEVANCE) stats.redevance = value;
            else if (label === STAT_LABELS.PART_SOCIAL) stats.partSocial = value;
            else if (label === STAT_LABELS.NIVEAU) stats.niveau = value;
        });

        return stats;
    }
}
