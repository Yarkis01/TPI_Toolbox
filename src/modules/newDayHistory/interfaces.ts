/**
 * Represents a single attraction record.
 */
export interface AttractionRecord {
    name: string;
    zone: string;
    capacity: number;
    costPerDay: number;
    waitTime: number;
    waitTimeStatus: 'good' | 'warning' | 'bad';
}

/**
 * Represents a restaurant record.
 */
export interface RestaurantRecord {
    name: string;
    zone: string;
    capacity: number;
    visitorsServed: number;
    revenue: number;
}

/**
 * Represents a boutique record.
 */
export interface BoutiqueRecord {
    name: string;
    zone: string;
    capacity: number;
    visitorsServed: number;
    salesDetail: string;
    revenue: number;
}

/**
 * Represents a spectacle record.
 */
export interface SpectacleRecord {
    name: string;
    zone: string;
    type: string;
    capacity: number;
    visitorsPerShow: number;
}

/**
 * Represents an attraction under construction.
 */
export interface WorkRecord {
    name: string;
    daysRemaining: number;
}

/**
 * Represents an employee movement.
 */
export interface EmployeeMovement {
    name: string;
    role: string;
    action: string;
}

/**
 * Represents a note detail item.
 */
export interface NoteDetailItem {
    type: string;
    calculation: string;
    points: number;
    isMaxed: boolean;
}

/**
 * Represents the HR section data.
 */
export interface HRData {
    employeeMovements: EmployeeMovement[];
    teamStateChanges: string[];
    availableEmployees: number;
    salary: number;
    totalHR: number;
    dailyResult: number;
}

/**
 * Represents the visitors section data.
 */
export interface VisitorsData {
    parkingOccupied: number;
    parkingAvailable: number;
    parkingFree: number;
    totalCapacity: number;
    securityCapacityBonus: number;
    visitorsByCar: number;
    visitorsByTransport: number;
    totalVisitors: number;
    adults: number;
    children: number;
    cleanliness: number;
    cleanlinessBonus: number;
    adultRevenue: number;
    childRevenue: number;
    totalEntryRevenue: number;
    dailyResult: number;
}

/**
 * Represents the attractions section data.
 */
export interface AttractionsData {
    openCount: number;
    attractions: AttractionRecord[];
    waitTimePenalty: number;
    coasterCount: number;
    flatrideCount: number;
    ratioBonus: number;
    themingBonus: number;
    electricityCost: number;
    totalCost: number;
    dailyResult: number;
    works: WorkRecord[];
}

/**
 * Represents the spectacles section data.
 */
export interface SpectaclesData {
    openCount: number;
    spectacles: SpectacleRecord[];
    totalCost: number;
    dailyResult: number;
}

/**
 * Represents the restaurants section data.
 */
export interface RestaurantsData {
    openCount: number;
    restaurants: RestaurantRecord[];
    electricityCost: number;
    rawMaterialsCost: number;
    totalRevenue: number;
    netRevenue: number;
    dailyResult: number;
    capacityWarnings: string[];
    works: WorkRecord[];
}

/**
 * Represents the boutiques section data.
 */
export interface BoutiquesData {
    openCount: number;
    boutiques: BoutiqueRecord[];
    productsCost: number;
    totalRevenue: number;
    netRevenue: number;
    dailyResult: number;
}

/**
 * Represents the taxes section data.
 */
export interface TaxesData {
    cityName: string;
    taxRate: number;
    taxAmount: number;
    dailyResult: number;
}

/**
 * Represents the other expenses section data.
 */
export interface OtherExpensesData {
    holdingFeeRate: number;
    holdingFeeAmount: number;
    dailyResult: number;
}

/**
 * Represents the daily summary data.
 */
export interface SummaryData {
    parkNote: number;
    experienceGained: number;
    dailyResult: number;
    noteDetails: NoteDetailItem[];
}

/**
 * Represents a single park's daily data.
 */
export interface ParkDayRecord {
    name: string;
    status: 'open' | 'closed' | 'unknown';
    hasWarning: boolean;
    finalResult: number;
    hr: HRData;
    visitors: VisitorsData;
    attractions: AttractionsData;
    spectacles: SpectaclesData | null;
    restaurants: RestaurantsData;
    boutiques: BoutiquesData;
    taxes: TaxesData;
    otherExpenses: OtherExpensesData;
    summary: SummaryData;
}

/**
 * Represents a complete day record with all parks.
 */
export interface DayRecord {
    id: string;
    timestamp: number;
    daysRemaining: number;
    message: string;
    parks: ParkDayRecord[];
    totalResult: number;
}
