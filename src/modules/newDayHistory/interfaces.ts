/**
 * Raw attraction record from localStorage new_day_report.
 */
export interface RawAttractionRecord {
    name: string;
    type: string;
    zone_name: string;
    capacite_reelle: number;
    electricity_cost: number;
    wait_time: number;
    wait_time_penalty: number;
    visitors_per_hour: number;
    wait_time_message?: string;
    hype: number;
    hype_with_bonus: number;
    fast_pass: number;
    fast_pass_revenue: number;
}

/**
 * Raw spectacle record from localStorage new_day_report.
 */
export interface RawSpectacleRecord {
    name: string;
    spectacle: string;
    zone_name: string | null;
    capacite_reelle: number;
    visitors_per_show: number;
    prix_jour: number;
}

/**
 * Raw restaurant record from localStorage new_day_report.
 */
export interface RawRestaurantRecord {
    name: string;
    type: string;
    zone_name: string;
    capacite_day: number;
    revenue?: number;
    visitorsServed?: number;
}

/**
 * Raw boutique record from localStorage new_day_report.
 */
export interface RawBoutiqueRecord {
    name: string;
    type: string;
    zone_name: string;
    capacite_day: number;
    revenue?: number;
    cost?: number;
    visitorsServed?: number;
}

/**
 * A tax line item.
 */
export interface TaxRecord {
    type: string;
    label: string;
    amount: number;
    details: string;
}

/**
 * Decomposed park note detail.
 */
export interface NoteDetail {
    final: number;
    subtotalBeforeThemeSeason: number;
    themeBonus: number;
    seasonBonus: number;
    cleanlinessPercent: number;
    cleanlinessNoteDelta: number;
    entranceSecurityDelta: number;
    attractionsWaitBonus: number;
    coasterCount: number;
    flatrideCount: number;
    balanceBonus: number;
}

/**
 * An employee who left or returned.
 */
export interface EmployeeMovement {
    name: string;
    poste: string;
}

/**
 * Payroll breakdown for a park day.
 */
export interface PayrollData {
    salaryTotal: number;
    paidEmployees: number;
    hrShortage: number;
    hrCapacity: number;
    costGuichet: number;
    costSecurite: number;
    costEntretien: number;
    costOperateursAttraction: number;
    costOperateursSpectacle: number;
    entranceStaffCost: number;
}

/**
 * A single transport line detail.
 */
export interface TransportLine {
    label: string;
    units: number;
    grossCost: number;
    reimbursement: number;
}

/**
 * A daily park event (alert, inspection, anomaly, etc.).
 */
export interface ParkEvent {
    subtitle: string;
    items: string[];
}

/**
 * A single park's full daily data record.
 */
export interface ParkDayRecord {
    name: string;
    status: 'open' | 'closed' | 'unknown';
    cityName: string;
    countryName: string;
    hasWarning: boolean;

    /** Cash delta after all taxes (day_result.delta_cash) */
    finalResult: number;

    /** Benefit before taxes but after transport/zone expenses */
    benefitBeforeTaxes: number;

    cashStart: number;
    cashEnd: number;
    experienceGain: number;
    parkNote: number;

    visitors: {
        total: number;
        adults: number;
        children: number;
        byCar: number;
        byTransport: number;
        revenueAdults: number;
        revenueChildren: number;
        revenueTotal: number;
        parkingTotal: number;
        parkingOccupied: number;
    };

    payroll: PayrollData;

    attractions: {
        open: RawAttractionRecord[];
        inWorks: Array<{ name: string }>;
        electricityTotal: number;
        waitTimeBonus: number;
        fastPassTotal: number;
        duplicatePenalty: number;
        maintenanceBonus: Array<{ name: string }>;
        technicians: {
            count: number;
            capacity: number;
            attractions: number;
            missing: number;
            hasShortage: boolean;
        };
    };

    spectacles: {
        open: RawSpectacleRecord[];
        totalCost: number;
    } | null;

    restaurants: {
        open: RawRestaurantRecord[];
        electricityTotal: number;
        bonus: number;
    };

    boutiques: {
        open: RawBoutiqueRecord[];
    };

    taxes: TaxRecord[];

    transport: {
        lines: TransportLine[];
        totalGross: number;
        totalReimbursement: number;
        netCost: number;
    };

    zoneImprovements: {
        totalCost: number;
        details: Array<{ zoneName: string; label: string; cost: number }>;
    };

    cleanliness: {
        percent: number;
        noteDelta: number;
        noteExplanation: string;
    };

    entrance: {
        throughputHour: number;
        activeBooths: number;
        securityCapacityHour: number;
        securityNoteDelta: number;
        securityNoteMessage: string;
    };

    seasonDecoration: {
        bonus: number;
        hasPlan: boolean;
        max: number;
        recapFr: string;
    };

    thematisationScore: number;
    thematisationZones: Array<{ zoneName: string; score: number; attractionCount: number }>;

    noteDetail: NoteDetail;

    events: ParkEvent[];

    notoriete: number;

    employees: {
        wentOff: EmployeeMovement[];
        backToWork: EmployeeMovement[];
    };
}

/**
 * A complete day record with all parks.
 */
export interface DayRecord {
    id: string;
    timestamp: number;
    day: number;
    daysRemaining: number;
    message: string;
    parks: ParkDayRecord[];
    totalResult: number;
}
