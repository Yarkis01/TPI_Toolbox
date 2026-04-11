import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { createElement } from '../../utils/DomUtils';
import { HistoryModal } from './HistoryModal';
import { HistoryStorage } from './HistoryStorage';
import { NEW_DAY_SELECTORS, NEW_DAY_STRINGS, STORAGE_CONFIG } from './constants';
import { DayRecord, ParkDayRecord, RawAttractionRecord, RawBoutiqueRecord, RawRestaurantRecord, RawSpectacleRecord, TaxRecord, PayrollData, TransportLine, ParkEvent } from './interfaces';
import './styles.scss';

/** Configuration keys for this module */
const CONFIG_KEYS = {
    MAX_RECORDS: 'maxRecords',
} as const;

/** localStorage key written by the game after each day advancement */
const LS_REPORT_KEY = 'new_day_report';

/** Polling interval in ms after the advance button is clicked */
const POLL_INTERVAL_MS = 500;

/** Maximum number of polling attempts (~30 s) */
const POLL_MAX_ATTEMPTS = 60;

/**
 * Raw shape of the `new_day_report` value the game writes to localStorage.
 * Mirrors the actual JSON structure written by the game.
 */
interface RawNewDayReport {
    day: number;
    timestamp: number;
    data: {
        success?: boolean;
        message?: string;
        day_left: number;
        parks: Array<{
            name: string;
            status: string;
            city_name: string;
            country_name: string;
            day_result: {
                cash_start: number;
                cash_end: number;
                delta_cash: number;
                experience_gain: number;
                new_note_park: number;
            };
            benefit_before_other_expenses: number;
            benefit_after_other_expenses: number;
            notoriete?: number;
            payroll?: {
                salary_total?: number;
                paid_employees?: number;
                hr_shortage_cost?: number;
                hr_capacity?: number;
                cost_guichet_today?: number;
                cost_securite_today?: number;
                cost_entretien_today?: number;
                cost_operateurs_attraction_today?: number;
                cost_operateurs_spectacle_today?: number;
                entrance_staff_cost_total?: number;
            };
            works?: {
                parking?: {
                    total_places?: number;
                    occupied_places?: number;
                };
                entrance?: {
                    throughput_hour?: number;
                    active_booths?: number;
                    security_capacity_hour?: number;
                    security_note_delta?: number;
                    security_note_message?: string;
                };
            };
            visitors?: {
                total?: number;
                adults?: number;
                children?: number;
                revenue_adults?: number;
                revenue_children?: number;
                revenue_total?: number;
                by_car?: number;
                by_transport?: number;
            };
            attractions?: {
                open?: RawAttractionRecord[];
                in_works?: Array<{ name: string }>;
                closed?: Array<{ name: string }>;
                electricity_total?: number;
                wait_time_bonus?: number;
                fast_pass_total?: number;
                duplicate_penalty?: number;
                maintenance_bonus?: Array<{ name: string }>;
                technicians?: {
                    count?: number;
                    capacity?: number;
                    attractions?: number;
                    missing?: number;
                    has_shortage?: boolean;
                };
            };
            spectacles?: {
                open?: RawSpectacleRecord[];
                total_cost?: number;
            };
            restaurants?: {
                open?: RawRestaurantRecord[];
                electricity_total?: number;
                bonus?: number;
                revenues?: Record<string, { name?: string; revenue?: number }>;
                sales?: Record<string, { name?: string; visitors_served?: number; sales?: Record<string, number> }>;
            };
            boutiques?: {
                open?: RawBoutiqueRecord[];
                revenues?: Record<string, { revenue?: number; cost?: number }>;
                sales?: Record<string, { visitors_served?: number; sales?: Record<string, number> }>;
            };
            employees?: {
                wentOff?: Array<{ name: string; poste: string }>;
                backToWork?: Array<{ name: string; poste: string }>;
            };
            cleanliness?: {
                percent?: number;
                note_delta?: number;
                note_explanation?: string;
            };
            taxes?: Array<{
                type?: string;
                label?: string;
                amount?: number;
                details?: string;
            }>;
            transport_expenses?: {
                net_park_cost?: number;
                total_gross?: number;
                total_reimbursement?: number;
                lines?: Array<{
                    type?: string;
                    label?: string;
                    units?: number;
                    gross_cost?: number;
                    reimbursement?: number;
                }>;
            };
            zone_improvements?: {
                total_cost?: number;
                details?: Array<{
                    zone_name?: string;
                    label?: string;
                    cost?: number;
                }>;
            };
            season_decoration?: {
                bonus?: number;
                has_plan?: boolean;
                max?: number;
                recap_calc_fr?: string;
            };
            thematisation_score?: {
                total_score?: number;
                bonus_applied?: number;
                zones?: Array<{
                    zone_name?: string;
                    score?: number;
                    attraction_count?: number;
                }>;
            };
            events?: Array<{
                subtitle?: string;
                items?: string[];
            }>;
            note_detail?: {
                final?: number;
                subtotal_before_theme_season?: number;
                theme_bonus?: number;
                season_bonus?: number;
                cleanliness?: {
                    percent?: number;
                    note_delta?: number;
                };
                entrance_security?: {
                    delta?: number;
                };
                attractions_wait_bonus?: number;
                balance_coaster_flatride?: {
                    coaster_count?: number;
                    flatride_count?: number;
                    bonus?: number;
                };
            };
            meta?: {
                has_warning?: boolean;
            };
        }>;
    };
}

/**
 * Module for tracking and displaying new day history.
 */
export class NewDayHistoryModule extends BaseModule {
    private _historyBtn: HTMLButtonElement | null = null;
    private _storage: HistoryStorage | null = null;
    private _modal: HistoryModal | null = null;
    private _advanceBtn: HTMLElement | null = null;
    private _boundHandleAdvance: (() => void) | null = null;
    private _pollTimer: ReturnType<typeof setInterval> | null = null;
    private _pollAttempts = 0;
    private _lastReportTimestamp = 0;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'new_day_history';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Historique des journées';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Enregistre et affiche l'historique des résumés de journée.";
    }

    /**
     * @inheritdoc
     */
    public override getConfigSchema(): IModuleConfigSchema {
        return {
            options: [
                {
                    key: CONFIG_KEYS.MAX_RECORDS,
                    label: "Nombre maximum d'entrées",
                    description: "Nombre maximum de journées à conserver dans l'historique.",
                    type: 'number',
                    defaultValue: STORAGE_CONFIG.MAX_RECORDS,
                    min: 1,
                    max: 365,
                    step: 1,
                },
            ],
        };
    }

    /**
     * @inheritdoc
     */
    public override init(): void {
        super.init();

        const maxRecords = this.getConfigValue(CONFIG_KEYS.MAX_RECORDS, STORAGE_CONFIG.MAX_RECORDS);
        this._storage = new HistoryStorage(STORAGE_CONFIG.STORAGE_KEY, maxRecords);
        this._modal = new HistoryModal(this._storage);
    }

    /**
     * @inheritdoc
     */
    protected override onConfigChanged(key: string, value: string | number | boolean): void {
        super.onConfigChanged(key, value);

        if (key === CONFIG_KEYS.MAX_RECORDS && typeof value === 'number') {
            this._storage = new HistoryStorage(STORAGE_CONFIG.STORAGE_KEY, value);
            if (this._modal) {
                this._modal = new HistoryModal(this._storage);
            }
            this._logger.info(`Max records updated to ${value}`);
        }
    }

    /**
     * @inheritdoc
     */
    public override canRunOnPage(url: string): boolean {
        return url.includes(NEW_DAY_SELECTORS.PAGE_MATCH);
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        // Ensure storage is initialized
        if (!this._storage) {
            const maxRecords = this.getConfigValue(
                CONFIG_KEYS.MAX_RECORDS,
                STORAGE_CONFIG.MAX_RECORDS,
            );
            this._storage = new HistoryStorage(STORAGE_CONFIG.STORAGE_KEY, maxRecords);
            this._modal = new HistoryModal(this._storage);
        }

        this._injectHistoryButton();
        this._setupAdvanceButtonListener();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._historyBtn?.remove();
        this._historyBtn = null;

        if (this._advanceBtn && this._boundHandleAdvance) {
            this._advanceBtn.removeEventListener('click', this._boundHandleAdvance);
            this._advanceBtn = null;
        }

        this._stopPolling();
        this._modal?.close();
    }

    /**
     * Creates and appends the history button.
     */
    private _injectHistoryButton(): void {
        const container = document.querySelector(NEW_DAY_SELECTORS.HISTORY_CONTAINER);
        if (!container) {
            const advanceBtn = document.querySelector(NEW_DAY_SELECTORS.ADVANCE_BUTTON);
            if (advanceBtn?.parentElement) {
                this._createAndInsertButton(advanceBtn.parentElement);
            }
            return;
        }

        this._createAndInsertButton(container);
    }

    /**
     * Creates the history button and inserts it into the container.
     */
    private _createAndInsertButton(container: Element): void {
        this._historyBtn = createElement(
            'button',
            {
                type: 'button',
                id: NEW_DAY_SELECTORS.HISTORY_BTN_ID,
                title: NEW_DAY_STRINGS.BTN_TITLE,
            },
            [NEW_DAY_STRINGS.BTN_LABEL],
        ) as HTMLButtonElement;

        this._historyBtn.addEventListener('click', () => this._openHistoryModal());

        container.appendChild(this._historyBtn);
    }

    /**
     * Opens the history modal.
     */
    private _openHistoryModal(): void {
        this._modal?.open();
    }

    /**
     * Sets up the listener for the advance day button.
     */
    private _setupAdvanceButtonListener(): void {
        this._advanceBtn = document.querySelector(NEW_DAY_SELECTORS.ADVANCE_BUTTON);

        if (this._advanceBtn) {
            if (!this._boundHandleAdvance) {
                this._boundHandleAdvance = this._handleAdvanceClick.bind(this);
            }
            this._advanceBtn.addEventListener('click', this._boundHandleAdvance);
            this._logger.info('Advance button listener attached');
        } else {
            this._logger.warn('Advance button not found');
        }
    }

    /**
     * Records the current report timestamp, then starts polling localStorage
     * for the game to write an updated `new_day_report` entry.
     */
    private _handleAdvanceClick(): void {
        const current = this._readRawReport();
        this._lastReportTimestamp = current?.timestamp ?? 0;
        this._logger.info('Advance clicked – polling localStorage for new report…');
        this._startPolling();
    }

    /**
     * Starts (or restarts) the polling loop.
     */
    private _startPolling(): void {
        this._stopPolling();
        this._pollAttempts = 0;

        this._pollTimer = setInterval(() => {
            this._pollAttempts++;

            if (this._pollAttempts > POLL_MAX_ATTEMPTS) {
                this._logger.warn('Polling timeout – no new report detected');
                this._stopPolling();
                return;
            }

            const report = this._readRawReport();
            if (report && report.timestamp !== this._lastReportTimestamp) {
                this._lastReportTimestamp = report.timestamp;
                this._stopPolling();
                this._saveReport(report);
            }
        }, POLL_INTERVAL_MS);
    }

    /**
     * Clears the active polling interval.
     */
    private _stopPolling(): void {
        if (this._pollTimer !== null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    /**
     * Reads and parses the raw `new_day_report` value from localStorage.
     * Returns null if absent or malformed.
     */
    private _readRawReport(): RawNewDayReport | null {
        try {
            const raw = localStorage.getItem(LS_REPORT_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as RawNewDayReport;
        } catch {
            return null;
        }
    }

    /**
     * Maps a raw localStorage report to a DayRecord and saves it to storage.
     */
    private _saveReport(report: RawNewDayReport): void {
        if (!this._storage) {
            this._logger.error('Storage not initialized');
            return;
        }

        if (!report.data?.parks?.length) {
            this._logger.warn('Report has no park data');
            return;
        }

        const record = this._mapToDayRecord(report);

        const existing = this._storage.getAll();
        const duplicate = existing.find(
            (r) => r.daysRemaining === record.daysRemaining && report.timestamp - r.timestamp < 60_000,
        );
        if (duplicate) {
            this._logger.info('Duplicate record detected, skipping save');
            return;
        }

        this._storage.save(record);
        this._logger.info(
            `Record saved – ${record.parks.length} park(s), ${record.daysRemaining} days remaining, total: ${record.totalResult}€`,
        );
    }

    /**
     * Converts a raw localStorage report to the DayRecord shape expected by storage.
     */
    private _mapToDayRecord(report: RawNewDayReport): DayRecord {
        const parks: ParkDayRecord[] = report.data.parks.map((p) => {
            const taxes: TaxRecord[] = (p.taxes ?? []).map((t) => ({
                type: t.type ?? '',
                label: t.label ?? '',
                amount: t.amount ?? 0,
                details: t.details ?? '',
            }));

            const nd = p.note_detail;

            const payroll: PayrollData = {
                salaryTotal: p.payroll?.salary_total ?? 0,
                paidEmployees: p.payroll?.paid_employees ?? 0,
                hrShortage: p.payroll?.hr_shortage_cost ?? 0,
                hrCapacity: p.payroll?.hr_capacity ?? 0,
                costGuichet: p.payroll?.cost_guichet_today ?? 0,
                costSecurite: p.payroll?.cost_securite_today ?? 0,
                costEntretien: p.payroll?.cost_entretien_today ?? 0,
                costOperateursAttraction: p.payroll?.cost_operateurs_attraction_today ?? 0,
                costOperateursSpectacle: p.payroll?.cost_operateurs_spectacle_today ?? 0,
                entranceStaffCost: p.payroll?.entrance_staff_cost_total ?? 0,
            };

            const restaurantRevenues = p.restaurants?.revenues ?? {};
            const restaurantSales = p.restaurants?.sales ?? {};
            const boutiqueRevenues = p.boutiques?.revenues ?? {};
            const boutiqueSales = p.boutiques?.sales ?? {};

            const transportLines: TransportLine[] = (p.transport_expenses?.lines ?? []).map((l) => ({
                label: l.label ?? '',
                units: l.units ?? 0,
                grossCost: l.gross_cost ?? 0,
                reimbursement: l.reimbursement ?? 0,
            }));

            const events: ParkEvent[] = (p.events ?? []).map((e) => ({
                subtitle: e.subtitle ?? '',
                items: e.items ?? [],
            }));

            return {
                name: p.name,
                status: p.status === 'ouvert' ? 'open' : p.status === 'fermé' ? 'closed' : 'unknown',
                cityName: p.city_name,
                countryName: p.country_name,
                hasWarning: p.meta?.has_warning ?? false,

                finalResult: p.day_result.delta_cash,
                benefitBeforeTaxes: p.benefit_after_other_expenses,
                cashStart: p.day_result.cash_start,
                cashEnd: p.day_result.cash_end,
                experienceGain: p.day_result.experience_gain,
                parkNote: p.day_result.new_note_park,

                visitors: {
                    total: p.visitors?.total ?? 0,
                    adults: p.visitors?.adults ?? 0,
                    children: p.visitors?.children ?? 0,
                    byCar: p.visitors?.by_car ?? 0,
                    byTransport: p.visitors?.by_transport ?? 0,
                    revenueAdults: p.visitors?.revenue_adults ?? 0,
                    revenueChildren: p.visitors?.revenue_children ?? 0,
                    revenueTotal: p.visitors?.revenue_total ?? 0,
                    parkingTotal: p.works?.parking?.total_places ?? 0,
                    parkingOccupied: p.works?.parking?.occupied_places ?? 0,
                },

                payroll,

                attractions: {
                    open: (p.attractions?.open ?? []).map((attr) => ({ ...attr })),
                    inWorks: p.attractions?.in_works ?? [],
                    electricityTotal: p.attractions?.electricity_total ?? 0,
                    waitTimeBonus: p.attractions?.wait_time_bonus ?? 0,
                    fastPassTotal: p.attractions?.fast_pass_total ?? 0,
                    duplicatePenalty: p.attractions?.duplicate_penalty ?? 0,
                    maintenanceBonus: (p.attractions?.maintenance_bonus ?? []).map((m) => ({ name: m.name })),
                    technicians: {
                        count: p.attractions?.technicians?.count ?? 0,
                        capacity: p.attractions?.technicians?.capacity ?? 0,
                        attractions: p.attractions?.technicians?.attractions ?? 0,
                        missing: p.attractions?.technicians?.missing ?? 0,
                        hasShortage: p.attractions?.technicians?.has_shortage ?? false,
                    },
                },

                spectacles: p.spectacles
                    ? {
                          open: p.spectacles.open ?? [],
                          totalCost: p.spectacles.total_cost ?? 0,
                      }
                    : null,

                restaurants: {
                    open: (p.restaurants?.open ?? []).map((r) => ({
                        ...r,
                        revenue: restaurantRevenues[String((r as any).id)]?.revenue,
                        visitorsServed: restaurantSales[String((r as any).id)]?.visitors_served,
                    })),
                    electricityTotal: p.restaurants?.electricity_total ?? 0,
                    bonus: p.restaurants?.bonus ?? 0,
                },

                boutiques: {
                    open: (p.boutiques?.open ?? []).map((b) => ({
                        ...b,
                        revenue: boutiqueRevenues[String((b as any).id)]?.revenue,
                        cost: boutiqueRevenues[String((b as any).id)]?.cost,
                        visitorsServed: boutiqueSales[String((b as any).id)]?.visitors_served,
                    })),
                },

                taxes,

                transport: {
                    lines: transportLines,
                    totalGross: p.transport_expenses?.total_gross ?? 0,
                    totalReimbursement: p.transport_expenses?.total_reimbursement ?? 0,
                    netCost: p.transport_expenses?.net_park_cost ?? 0,
                },

                zoneImprovements: {
                    totalCost: p.zone_improvements?.total_cost ?? 0,
                    details: (p.zone_improvements?.details ?? []).map((d) => ({
                        zoneName: d.zone_name ?? '',
                        label: d.label ?? '',
                        cost: d.cost ?? 0,
                    })),
                },

                cleanliness: {
                    percent: p.cleanliness?.percent ?? 100,
                    noteDelta: p.cleanliness?.note_delta ?? 0,
                    noteExplanation: p.cleanliness?.note_explanation ?? '',
                },

                entrance: {
                    throughputHour: p.works?.entrance?.throughput_hour ?? 0,
                    activeBooths: p.works?.entrance?.active_booths ?? 0,
                    securityCapacityHour: p.works?.entrance?.security_capacity_hour ?? 0,
                    securityNoteDelta: p.works?.entrance?.security_note_delta ?? 0,
                    securityNoteMessage: p.works?.entrance?.security_note_message ?? '',
                },

                seasonDecoration: {
                    bonus: p.season_decoration?.bonus ?? 0,
                    hasPlan: p.season_decoration?.has_plan ?? false,
                    max: p.season_decoration?.max ?? 0,
                    recapFr: p.season_decoration?.recap_calc_fr ?? '',
                },

                thematisationScore: p.thematisation_score?.bonus_applied ?? 0,
                thematisationZones: (p.thematisation_score?.zones ?? []).map((z) => ({
                    zoneName: z.zone_name ?? '',
                    score: z.score ?? 0,
                    attractionCount: z.attraction_count ?? 0,
                })),

                noteDetail: {
                    final: nd?.final ?? p.day_result.new_note_park,
                    subtotalBeforeThemeSeason: nd?.subtotal_before_theme_season ?? 0,
                    themeBonus: nd?.theme_bonus ?? 0,
                    seasonBonus: nd?.season_bonus ?? 0,
                    cleanlinessPercent: nd?.cleanliness?.percent ?? 0,
                    cleanlinessNoteDelta: nd?.cleanliness?.note_delta ?? 0,
                    entranceSecurityDelta: nd?.entrance_security?.delta ?? 0,
                    attractionsWaitBonus: nd?.attractions_wait_bonus ?? 0,
                    coasterCount: nd?.balance_coaster_flatride?.coaster_count ?? 0,
                    flatrideCount: nd?.balance_coaster_flatride?.flatride_count ?? 0,
                    balanceBonus: nd?.balance_coaster_flatride?.bonus ?? 0,
                },

                events,
                notoriete: p.notoriete ?? 0,

                employees: {
                    wentOff: (p.employees?.wentOff ?? []).map((e) => ({
                        name: e.name,
                        poste: e.poste,
                    })),
                    backToWork: (p.employees?.backToWork ?? []).map((e) => ({
                        name: e.name,
                        poste: e.poste,
                    })),
                },
            };
        });

        const totalResult = parks.reduce((sum, p) => sum + p.finalResult, 0);

        return {
            id: report.timestamp.toString(),
            timestamp: report.timestamp,
            day: report.day,
            daysRemaining: report.data.day_left,
            message: report.data.message ?? '',
            parks,
            totalResult,
        };
    }
}
