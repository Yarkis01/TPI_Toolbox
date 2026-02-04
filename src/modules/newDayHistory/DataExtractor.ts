import { NEW_DAY_SELECTORS } from './constants';
import {
    DayRecord,
    ParkDayRecord,
    HRData,
    VisitorsData,
    AttractionsData,
    SpectaclesData,
    RestaurantsData,
    BoutiquesData,
    TaxesData,
    OtherExpensesData,
    SummaryData,
    AttractionRecord,
    RestaurantRecord,
    BoutiqueRecord,
    SpectacleRecord,
    WorkRecord,
    EmployeeMovement,
    NoteDetailItem,
} from './interfaces';

/**
 * Extracts day recap data from the DOM.
 */
export class DataExtractor {
    /**
     * Generates a unique ID for a day record.
     * @returns A unique string ID.
     */
    private _generateId(): string {
        return `day_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Parses a French formatted number string to a number.
     * @param text - The text containing the number.
     * @returns The parsed number.
     */
    private _parseNumber(text: string): number {
        if (!text) return 0;

        // Remove currency symbols, spaces, and handle French formatting
        const cleaned = text
            .replace(/[€$£]/g, '')
            .replace(/\s/g, '')
            .replace(/\u00A0/g, '') // non-breaking space
            .replace(/[+\-]/g, (match) => (match === '-' ? '-' : ''))
            .replace(/,/g, '.')
            .trim();

        // Extract the number
        const match = cleaned.match(/-?\d+(?:\.\d+)?/);
        if (match) {
            return parseFloat(match[0]);
        }
        return 0;
    }

    /**
     * Parses a signed number (with + or -).
     * @param text - The text containing the signed number.
     * @returns The parsed number with correct sign.
     */
    private _parseSignedNumber(text: string): number {
        if (!text) return 0;

        const isNegative = text.includes('-');
        const value = this._parseNumber(text);

        return isNegative ? -Math.abs(value) : Math.abs(value);
    }

    /**
     * Extracts text content from an element.
     * @param parent - The parent element.
     * @param selector - The CSS selector.
     * @returns The text content or empty string.
     */
    private _getText(parent: Element, selector: string): string {
        const element = parent.querySelector(selector);
        return element?.textContent?.trim() || '';
    }

    /**
     * Extracts days remaining from the message.
     * @param message - The recap message.
     * @returns The number of days remaining.
     */
    private _parseDaysRemaining(message: string): number {
        const daysMatch = message.match(/(\d+)\s*jour\(s\)/);
        return daysMatch ? parseInt(daysMatch[1], 10) : 0;
    }

    /**
     * Determines wait time status from color.
     * @param element - The element with the color style.
     * @returns The status string.
     */
    private _getWaitTimeStatus(element: Element): 'good' | 'warning' | 'bad' {
        const style = element.getAttribute('style') || '';
        if (style.includes('46, 204, 113') || style.includes('rgb(46, 204, 113)')) {
            return 'good';
        }
        if (style.includes('255, 165, 0') || style.includes('rgb(255, 165, 0)')) {
            return 'warning';
        }
        if (style.includes('231, 76, 60') || style.includes('rgb(231, 76, 60)')) {
            return 'bad';
        }
        return 'warning';
    }

    /**
     * Extracts HR data from a park section.
     * @param parkElement - The park card element.
     * @returns HR data object.
     */
    private _extractHRData(parkElement: Element): HRData {
        const hrSection = parkElement.querySelector(NEW_DAY_SELECTORS.HR_SECTION);
        if (!hrSection) {
            return this._getDefaultHRData();
        }

        // Extract employee movements
        const employeeMovements: EmployeeMovement[] = [];
        const employeeList = hrSection.querySelector('.new-day-modal__park-rh-employee-list');
        if (employeeList) {
            employeeList.querySelectorAll('li').forEach((li) => {
                const text = li.textContent || '';
                const match = text.match(/(.+?)\s*\((.+?)\)\s*(.+)/);
                if (match) {
                    employeeMovements.push({
                        name: match[1].trim(),
                        role: match[2].trim(),
                        action: match[3].trim(),
                    });
                }
            });
        }

        // Extract available employees count
        const availableText = this._getText(hrSection, '.new-day-modal__park-rh-available-count');
        const availableMatch = availableText.match(/(\d+)/);
        const availableEmployees = availableMatch ? parseInt(availableMatch[1], 10) : 0;

        // Extract salary
        const financeList = hrSection.querySelector('.new-day-modal__park-rh-finance-list');
        let salary = 0;
        if (financeList) {
            const salaryItem = financeList.querySelector('li');
            if (salaryItem) {
                const span = salaryItem.querySelector('span');
                if (span) {
                    salary = Math.abs(this._parseSignedNumber(span.textContent || ''));
                }
            }
        }

        // Extract footer values
        const totalHR = this._parseSignedNumber(
            this._getText(hrSection, '.new-day-modal__park-rh-footer-left .new-day-modal__park-rh-footer-value'),
        );
        const dailyResult = this._parseSignedNumber(
            this._getText(hrSection, '.new-day-modal__park-rh-footer-right .new-day-modal__park-rh-footer-value'),
        );

        return {
            employeeMovements,
            teamStateChanges: [],
            availableEmployees,
            salary,
            totalHR,
            dailyResult,
        };
    }

    /**
     * Returns default HR data.
     */
    private _getDefaultHRData(): HRData {
        return {
            employeeMovements: [],
            teamStateChanges: [],
            availableEmployees: 0,
            salary: 0,
            totalHR: 0,
            dailyResult: 0,
        };
    }

    /**
     * Extracts visitors data from a park section.
     * @param parkElement - The park card element.
     * @returns Visitors data object.
     */
    private _extractVisitorsData(parkElement: Element): VisitorsData {
        const visitorsSection = parkElement.querySelector(NEW_DAY_SELECTORS.VISITORS_SECTION);
        if (!visitorsSection) {
            return this._getDefaultVisitorsData();
        }

        // Parse parking info
        const parkingInfo = this._getText(visitorsSection, '.new-day-modal__park-visitors-parking-info');
        const parkingMatch = parkingInfo.match(/(\d[\d\s]*)\s*place\(s\)\s*occupée\(s\)\s*\/\s*(\d[\d\s]*)\s*place\(s\)\s*disponible\(s\)\s*\((\d[\d\s]*)\s*libre/);
        const parkingOccupied = parkingMatch ? this._parseNumber(parkingMatch[1]) : 0;
        const parkingAvailable = parkingMatch ? this._parseNumber(parkingMatch[2]) : 0;
        const parkingFree = parkingMatch ? this._parseNumber(parkingMatch[3]) : 0;

        // Parse entrance capacity
        const entranceList = visitorsSection.querySelector('.new-day-modal__park-visitors-entrance-list');
        let totalCapacity = 0;
        let securityCapacityBonus = 0;
        if (entranceList) {
            const capacityItem = entranceList.querySelector('li');
            if (capacityItem) {
                const capacityMatch = capacityItem.textContent?.match(/(\d[\d\s]*)\s*pers\./);
                totalCapacity = capacityMatch ? this._parseNumber(capacityMatch[1]) : 0;
            }
            // Check for security bonus
            const securityItem = Array.from(entranceList.querySelectorAll('li')).find((li) =>
                li.textContent?.includes('sécurité'),
            );
            if (securityItem) {
                const bonusSpan = securityItem.querySelector('span[style*="46, 204, 113"]');
                if (bonusSpan) {
                    const bonusMatch = bonusSpan.textContent?.match(/\+(\d+)/);
                    securityCapacityBonus = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
                }
            }
        }

        // Parse visitors
        const visitorsList = visitorsSection.querySelector('.new-day-modal__park-visitors-visitors-list');
        let visitorsByCar = 0;
        let visitorsByTransport = 0;
        let totalVisitors = 0;
        let adults = 0;
        let children = 0;
        if (visitorsList) {
            const items = visitorsList.querySelectorAll('li');
            items.forEach((item) => {
                const text = item.textContent || '';
                if (text.includes('voiture')) {
                    visitorsByCar = this._parseNumber(text);
                } else if (text.includes('transport')) {
                    visitorsByTransport = this._parseNumber(text);
                } else if (text.includes('entrés')) {
                    totalVisitors = this._parseNumber(text);
                } else if (text.includes('Adultes')) {
                    const match = text.match(/Adultes\s*:\s*([\d\s]+).*Enfants\s*:\s*([\d\s]+)/);
                    if (match) {
                        adults = this._parseNumber(match[1]);
                        children = this._parseNumber(match[2]);
                    }
                }
            });
        }

        // Parse cleanliness
        const opinionList = visitorsSection.querySelector('.new-day-modal__park-visitors-opinion-list');
        let cleanliness = 100;
        let cleanlinessBonus = 0;
        if (opinionList) {
            const cleanlinessItem = opinionList.querySelector('li');
            if (cleanlinessItem) {
                const cleanMatch = cleanlinessItem.textContent?.match(/(\d+)\s*%/);
                cleanliness = cleanMatch ? parseInt(cleanMatch[1], 10) : 100;
                const bonusSpan = cleanlinessItem.querySelector('span[style*="46, 204, 113"]');
                if (bonusSpan) {
                    const bonusMatch = bonusSpan.textContent?.match(/\+(\d+)/);
                    cleanlinessBonus = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
                }
            }
        }

        // Parse revenues
        const revenueList = visitorsSection.querySelector('.new-day-modal__park-visitors-revenue-list');
        let adultRevenue = 0;
        let childRevenue = 0;
        if (revenueList) {
            const items = revenueList.querySelectorAll('li');
            items.forEach((item) => {
                const text = item.textContent || '';
                const span = item.querySelector('span');
                const value = span ? this._parseSignedNumber(span.textContent || '') : 0;
                if (text.includes('adultes')) {
                    adultRevenue = value;
                } else if (text.includes('enfant')) {
                    childRevenue = value;
                }
            });
        }

        // Parse footer
        const footer = visitorsSection.querySelector('.new-day-modal__park-visitors-revenue-footer');
        const totalEntryRevenue = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-visitors-revenue-footer-left .new-day-modal__park-visitors-revenue-footer-value'),
            )
            : adultRevenue + childRevenue;
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-visitors-revenue-footer-right .new-day-modal__park-visitors-revenue-footer-value'),
            )
            : totalEntryRevenue;

        return {
            parkingOccupied,
            parkingAvailable,
            parkingFree,
            totalCapacity,
            securityCapacityBonus,
            visitorsByCar,
            visitorsByTransport,
            totalVisitors,
            adults,
            children,
            cleanliness,
            cleanlinessBonus,
            adultRevenue,
            childRevenue,
            totalEntryRevenue,
            dailyResult,
        };
    }

    /**
     * Returns default visitors data.
     */
    private _getDefaultVisitorsData(): VisitorsData {
        return {
            parkingOccupied: 0,
            parkingAvailable: 0,
            parkingFree: 0,
            totalCapacity: 0,
            securityCapacityBonus: 0,
            visitorsByCar: 0,
            visitorsByTransport: 0,
            totalVisitors: 0,
            adults: 0,
            children: 0,
            cleanliness: 100,
            cleanlinessBonus: 0,
            adultRevenue: 0,
            childRevenue: 0,
            totalEntryRevenue: 0,
            dailyResult: 0,
        };
    }

    /**
     * Extracts attractions data from a park section.
     * @param parkElement - The park card element.
     * @returns Attractions data object.
     */
    private _extractAttractionsData(parkElement: Element): AttractionsData {
        // Find the attractions section (not spectacles, restaurants, boutiques, or taxes)
        const allSections = parkElement.querySelectorAll('.new-day-modal__park-attractions');
        let attractionsSection: Element | null = null;

        for (const section of Array.from(allSections)) {
            const header = section.querySelector('.new-day-modal__park-attractions-header-title');
            if (header?.textContent?.includes('Attractions') && !header?.textContent?.includes('Spectacles')) {
                attractionsSection = section;
                break;
            }
        }

        if (!attractionsSection) {
            return this._getDefaultAttractionsData();
        }

        // Parse open count
        const openSubtitle = this._getText(attractionsSection, '.new-day-modal__park-attractions-open-subtitle');
        const openMatch = openSubtitle.match(/(\d+)/);
        const openCount = openMatch ? parseInt(openMatch[1], 10) : 0;

        // Parse attractions table
        const attractions: AttractionRecord[] = [];
        const table = attractionsSection.querySelector('.new-day-modal__attractions-table tbody');
        let currentZone = '';
        if (table) {
            table.querySelectorAll('tr').forEach((row) => {
                if (row.classList.contains('new-day-modal__attractions-zone-title-row')) {
                    currentZone = row.querySelector('.new-day-modal__attractions-zone-title')?.textContent?.trim() || '';
                } else {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        const waitTimeCell = cells[3];
                        attractions.push({
                            name: cells[0].textContent?.trim() || '',
                            zone: currentZone,
                            capacity: this._parseNumber(cells[1].textContent || ''),
                            costPerDay: this._parseNumber(cells[2].textContent || ''),
                            waitTime: this._parseNumber(cells[3].textContent || ''),
                            waitTimeStatus: this._getWaitTimeStatus(waitTimeCell),
                        });
                    }
                }
            });
        }

        // Parse wait time penalty
        const waitAlert = this._getText(attractionsSection, '.new-day-modal__park-attractions-wait-time-alert');
        const penaltyMatch = waitAlert.match(/-(\d+)/);
        const waitTimePenalty = penaltyMatch ? parseInt(penaltyMatch[1], 10) : 0;

        // Parse ratio section
        const ratioText = this._getText(attractionsSection, '.new-day-modal__park-attractions-ratio-section');
        const coasterMatch = ratioText.match(/(\d+)\s*coasters?/i);
        const flatMatch = ratioText.match(/(\d+)\s*flatrides?/i);
        const ratioBonusMatch = ratioText.match(/\+(\d+)\s*points/);
        const themingMatch = ratioText.match(/thématisation\s*:\s*\+(\d+)/i);

        const coasterCount = coasterMatch ? parseInt(coasterMatch[1], 10) : 0;
        const flatrideCount = flatMatch ? parseInt(flatMatch[1], 10) : 0;
        const ratioBonus = ratioBonusMatch ? parseInt(ratioBonusMatch[1], 10) : 0;
        const themingBonus = themingMatch ? parseInt(themingMatch[1], 10) : 0;

        // Parse works
        const works: WorkRecord[] = [];
        const worksList = attractionsSection.querySelector('.new-day-modal__park-attractions-works-list');
        if (worksList) {
            worksList.querySelectorAll('li').forEach((li) => {
                const text = li.textContent || '';
                const match = text.match(/(.+?)\s*-\s*(\d+)\s*jours?\s*restants?/);
                if (match) {
                    works.push({
                        name: match[1].trim(),
                        daysRemaining: parseInt(match[2], 10),
                    });
                }
            });
        }

        // Parse revenue section
        const revenueList = attractionsSection.querySelector('.new-day-modal__park-attractions-revenue-list');
        let electricityCost = 0;
        if (revenueList) {
            const elecItem = Array.from(revenueList.querySelectorAll('li')).find((li) =>
                li.textContent?.includes('électricité'),
            );
            if (elecItem) {
                const span = elecItem.querySelector('span');
                electricityCost = Math.abs(this._parseSignedNumber(span?.textContent || ''));
            }
        }

        // Parse footer
        const footer = attractionsSection.querySelector('.new-day-modal__park-attractions-revenue-footer');
        const totalCost = footer
            ? Math.abs(
                this._parseSignedNumber(
                    this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-left .new-day-modal__park-attractions-revenue-footer-value'),
                ),
            )
            : electricityCost;
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : 0;

        return {
            openCount,
            attractions,
            waitTimePenalty,
            coasterCount,
            flatrideCount,
            ratioBonus,
            themingBonus,
            electricityCost,
            totalCost,
            dailyResult,
            works,
        };
    }

    /**
     * Returns default attractions data.
     */
    private _getDefaultAttractionsData(): AttractionsData {
        return {
            openCount: 0,
            attractions: [],
            waitTimePenalty: 0,
            coasterCount: 0,
            flatrideCount: 0,
            ratioBonus: 0,
            themingBonus: 0,
            electricityCost: 0,
            totalCost: 0,
            dailyResult: 0,
            works: [],
        };
    }

    /**
     * Extracts spectacles data from a park section.
     * @param parkElement - The park card element.
     * @returns Spectacles data object or null if no spectacles.
     */
    private _extractSpectaclesData(parkElement: Element): SpectaclesData | null {
        const spectaclesSection = parkElement.querySelector(NEW_DAY_SELECTORS.SPECTACLES_SECTION);
        if (!spectaclesSection) {
            return null;
        }

        // Parse open count
        const openSubtitle = this._getText(spectaclesSection, '.new-day-modal__park-attractions-open-subtitle');
        const openMatch = openSubtitle.match(/(\d+)/);
        const openCount = openMatch ? parseInt(openMatch[1], 10) : 0;

        // Parse spectacles table
        const spectacles: SpectacleRecord[] = [];
        const table = spectaclesSection.querySelector('.new-day-modal__attractions-table tbody');
        let currentZone = '';
        if (table) {
            table.querySelectorAll('tr').forEach((row) => {
                if (row.classList.contains('new-day-modal__attractions-zone-title-row')) {
                    currentZone = row.querySelector('.new-day-modal__attractions-zone-title')?.textContent?.trim() || '';
                } else {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        spectacles.push({
                            name: cells[0].textContent?.trim() || '',
                            zone: currentZone,
                            type: cells[1].textContent?.trim() || '',
                            capacity: this._parseNumber(cells[2].textContent || ''),
                            visitorsPerShow: this._parseNumber(cells[3].textContent || ''),
                        });
                    }
                }
            });
        }

        // Parse footer
        const footer = spectaclesSection.querySelector('.new-day-modal__park-attractions-revenue-footer');
        const totalCost = footer
            ? Math.abs(
                this._parseSignedNumber(
                    this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-left .new-day-modal__park-attractions-revenue-footer-value'),
                ),
            )
            : 0;
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : 0;

        return {
            openCount,
            spectacles,
            totalCost,
            dailyResult,
        };
    }

    /**
     * Extracts restaurants data from a park section.
     * @param parkElement - The park card element.
     * @returns Restaurants data object.
     */
    private _extractRestaurantsData(parkElement: Element): RestaurantsData {
        const restaurantsSection = parkElement.querySelector(NEW_DAY_SELECTORS.RESTAURANTS_SECTION);
        if (!restaurantsSection) {
            return this._getDefaultRestaurantsData();
        }

        // Parse open count
        const openSubtitle = this._getText(restaurantsSection, '.new-day-modal__park-attractions-open-subtitle');
        const openMatch = openSubtitle.match(/(\d+)/);
        const openCount = openMatch ? parseInt(openMatch[1], 10) : 0;

        // Parse restaurants table
        const restaurants: RestaurantRecord[] = [];
        const table = restaurantsSection.querySelector('.new-day-modal__attractions-table tbody');
        let currentZone = '';
        if (table) {
            table.querySelectorAll('tr').forEach((row) => {
                if (row.classList.contains('new-day-modal__attractions-zone-title-row')) {
                    currentZone = row.querySelector('.new-day-modal__attractions-zone-title')?.textContent?.trim() || '';
                } else {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        restaurants.push({
                            name: cells[0].textContent?.trim() || '',
                            zone: currentZone,
                            capacity: this._parseNumber(cells[1].textContent || ''),
                            visitorsServed: this._parseNumber(cells[2].textContent || ''),
                            revenue: this._parseSignedNumber(cells[3].textContent || ''),
                        });
                    }
                }
            });
        }

        // Parse capacity warnings
        const capacityWarnings: string[] = [];
        const warningSection = restaurantsSection.querySelector('.new-day-modal__park-attractions-works-section--in-open-section');
        if (warningSection) {
            warningSection.querySelectorAll('li').forEach((li) => {
                capacityWarnings.push(li.textContent?.trim() || '');
            });
        }

        // Parse works
        const works: WorkRecord[] = [];
        const worksList = restaurantsSection.querySelector('.new-day-modal__park-attractions-works-section:not(.new-day-modal__park-attractions-works-section--in-open-section) .new-day-modal__park-attractions-works-list');
        if (worksList) {
            worksList.querySelectorAll('li').forEach((li) => {
                const text = li.textContent || '';
                const match = text.match(/(.+?)\s*-\s*(\d+)\s*jours?\s*restants?/);
                if (match) {
                    works.push({
                        name: match[1].trim(),
                        daysRemaining: parseInt(match[2], 10),
                    });
                }
            });
        }

        // Parse revenue section
        const revenueList = restaurantsSection.querySelector('.new-day-modal__park-attractions-revenue-list');
        let electricityCost = 0;
        let rawMaterialsCost = 0;
        let totalRevenue = 0;
        if (revenueList) {
            revenueList.querySelectorAll('li').forEach((li) => {
                const text = li.textContent || '';
                const span = li.querySelector('span');
                const value = this._parseSignedNumber(span?.textContent || '');
                if (text.includes('électricité')) {
                    electricityCost = Math.abs(value);
                } else if (text.includes('matières premières')) {
                    rawMaterialsCost = Math.abs(value);
                } else if (text.includes('Revenus')) {
                    totalRevenue = value;
                }
            });
        }

        // Parse footer
        const footer = restaurantsSection.querySelector('.new-day-modal__park-attractions-revenue-footer');
        const netRevenue = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-left .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : totalRevenue - electricityCost - rawMaterialsCost;
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : 0;

        return {
            openCount,
            restaurants,
            electricityCost,
            rawMaterialsCost,
            totalRevenue,
            netRevenue,
            dailyResult,
            capacityWarnings,
            works,
        };
    }

    /**
     * Returns default restaurants data.
     */
    private _getDefaultRestaurantsData(): RestaurantsData {
        return {
            openCount: 0,
            restaurants: [],
            electricityCost: 0,
            rawMaterialsCost: 0,
            totalRevenue: 0,
            netRevenue: 0,
            dailyResult: 0,
            capacityWarnings: [],
            works: [],
        };
    }

    /**
     * Extracts boutiques data from a park section.
     * @param parkElement - The park card element.
     * @returns Boutiques data object.
     */
    private _extractBoutiquesData(parkElement: Element): BoutiquesData {
        const boutiquesSection = parkElement.querySelector(NEW_DAY_SELECTORS.BOUTIQUES_SECTION);
        if (!boutiquesSection) {
            return this._getDefaultBoutiquesData();
        }

        // Parse open count
        const openSubtitle = this._getText(boutiquesSection, '.new-day-modal__park-attractions-open-subtitle');
        const openMatch = openSubtitle.match(/(\d+)/);
        const openCount = openMatch ? parseInt(openMatch[1], 10) : 0;

        // Parse boutiques table
        const boutiques: BoutiqueRecord[] = [];
        const table = boutiquesSection.querySelector('.new-day-modal__attractions-table tbody');
        let currentZone = '';
        if (table) {
            table.querySelectorAll('tr').forEach((row) => {
                if (row.classList.contains('new-day-modal__attractions-zone-title-row')) {
                    currentZone = row.querySelector('.new-day-modal__attractions-zone-title')?.textContent?.trim() || '';
                } else {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        boutiques.push({
                            name: cells[0].textContent?.trim() || '',
                            zone: currentZone,
                            capacity: this._parseNumber(cells[1].textContent || ''),
                            visitorsServed: this._parseNumber(cells[2].textContent || ''),
                            salesDetail: cells[3].textContent?.trim() || '',
                            revenue: this._parseSignedNumber(cells[4].textContent || ''),
                        });
                    }
                }
            });
        }

        // Parse revenue section
        const revenueList = boutiquesSection.querySelector('.new-day-modal__park-attractions-revenue-list');
        let productsCost = 0;
        let totalRevenue = 0;
        if (revenueList) {
            revenueList.querySelectorAll('li').forEach((li) => {
                const text = li.textContent || '';
                const span = li.querySelector('span');
                const value = this._parseSignedNumber(span?.textContent || '');
                if (text.includes('Coût d\'achat')) {
                    productsCost = Math.abs(value);
                } else if (text.includes('Revenus')) {
                    totalRevenue = value;
                }
            });
        }

        // Parse footer
        const footer = boutiquesSection.querySelector('.new-day-modal__park-attractions-revenue-footer');
        const netRevenue = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-left .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : totalRevenue - productsCost;
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : 0;

        return {
            openCount,
            boutiques,
            productsCost,
            totalRevenue,
            netRevenue,
            dailyResult,
        };
    }

    /**
     * Returns default boutiques data.
     */
    private _getDefaultBoutiquesData(): BoutiquesData {
        return {
            openCount: 0,
            boutiques: [],
            productsCost: 0,
            totalRevenue: 0,
            netRevenue: 0,
            dailyResult: 0,
        };
    }

    /**
     * Extracts taxes data from a park section.
     * @param parkElement - The park card element.
     * @returns Taxes data object.
     */
    private _extractTaxesData(parkElement: Element): TaxesData {
        const taxesSection = parkElement.querySelector(NEW_DAY_SELECTORS.TAXES_SECTION);
        if (!taxesSection) {
            return this._getDefaultTaxesData();
        }

        // Parse city name
        const citySubtitle = this._getText(taxesSection, '.new-day-modal__park-attractions-open-subtitle');
        const cityMatch = citySubtitle.match(/Taxes de la ville de (.+)/);
        const cityName = cityMatch ? cityMatch[1].trim() : '';

        // Parse tax details
        const taxList = taxesSection.querySelector('.new-day-modal__park-details-list');
        let taxRate = 0;
        let taxAmount = 0;
        if (taxList) {
            const taxItem = taxList.querySelector('li');
            if (taxItem) {
                const rateMatch = taxItem.textContent?.match(/\((\d+)%\)/);
                taxRate = rateMatch ? parseInt(rateMatch[1], 10) : 0;
                const amountSpan = taxItem.querySelector('span[style*="231, 76, 60"]');
                taxAmount = amountSpan ? Math.abs(this._parseSignedNumber(amountSpan.textContent || '')) : 0;
            }
        }

        // Parse footer
        const footer = taxesSection.querySelector('.new-day-modal__park-attractions-revenue-footer');
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : 0;

        return {
            cityName,
            taxRate,
            taxAmount,
            dailyResult,
        };
    }

    /**
     * Returns default taxes data.
     */
    private _getDefaultTaxesData(): TaxesData {
        return {
            cityName: '',
            taxRate: 0,
            taxAmount: 0,
            dailyResult: 0,
        };
    }

    /**
     * Extracts other expenses data from a park section.
     * @param parkElement - The park card element.
     * @returns Other expenses data object.
     */
    private _extractOtherExpensesData(parkElement: Element): OtherExpensesData {
        // Find the "Autres dépenses" section
        const allSections = parkElement.querySelectorAll('.new-day-modal__park-attractions');
        let expensesSection: Element | null = null;

        for (const section of Array.from(allSections)) {
            const header = section.querySelector('.new-day-modal__park-attractions-header-title');
            if (header?.textContent?.includes('Autres dépenses')) {
                expensesSection = section;
                break;
            }
        }

        if (!expensesSection) {
            return this._getDefaultOtherExpensesData();
        }

        // Parse holding fee
        const expensesList = expensesSection.querySelector('.new-day-modal__park-details-list');
        let holdingFeeRate = 0;
        let holdingFeeAmount = 0;
        if (expensesList) {
            const feeItem = expensesList.querySelector('li');
            if (feeItem) {
                const rateMatch = feeItem.textContent?.match(/\((\d+)%\)/);
                holdingFeeRate = rateMatch ? parseInt(rateMatch[1], 10) : 0;
                const amountSpan = feeItem.querySelector('span[style*="231, 76, 60"]');
                holdingFeeAmount = amountSpan ? Math.abs(this._parseSignedNumber(amountSpan.textContent || '')) : 0;
            }
        }

        // Parse footer
        const footer = expensesSection.querySelector('.new-day-modal__park-attractions-revenue-footer');
        const dailyResult = footer
            ? this._parseSignedNumber(
                this._getText(footer, '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value'),
            )
            : 0;

        return {
            holdingFeeRate,
            holdingFeeAmount,
            dailyResult,
        };
    }

    /**
     * Returns default other expenses data.
     */
    private _getDefaultOtherExpensesData(): OtherExpensesData {
        return {
            holdingFeeRate: 0,
            holdingFeeAmount: 0,
            dailyResult: 0,
        };
    }

    /**
     * Extracts summary data from a park section.
     * @param parkElement - The park card element.
     * @returns Summary data object.
     */
    private _extractSummaryData(parkElement: Element): SummaryData {
        // Find the "Récapitulatif de la journée" section
        const allSections = parkElement.querySelectorAll('.new-day-modal__park-attractions');
        let summarySection: Element | null = null;

        for (const section of Array.from(allSections)) {
            const header = section.querySelector('.new-day-modal__park-attractions-header-title');
            if (header?.textContent?.includes('Récapitulatif')) {
                summarySection = section;
                break;
            }
        }

        if (!summarySection) {
            return this._getDefaultSummaryData();
        }

        // Parse summary values
        const summaryBlocks = summarySection.querySelectorAll('.new-day-modal__park-summary-item-block');
        let parkNote = 0;
        let experienceGained = 0;
        let dailyResult = 0;

        summaryBlocks.forEach((block) => {
            const label = block.querySelector('.new-day-modal__park-summary-item-label')?.textContent || '';
            const value = block.querySelector('.new-day-modal__park-summary-item-value')?.textContent || '';

            if (label.includes('Note')) {
                parkNote = this._parseNumber(value);
            } else if (label.includes('Expérience')) {
                experienceGained = this._parseNumber(value);
            } else if (label.includes('Résultat')) {
                dailyResult = this._parseSignedNumber(value);
            }
        });

        // Parse note details
        const noteDetails: NoteDetailItem[] = [];
        const noteTable = summarySection.querySelector('.new-day-modal__park-note-detail-table tbody');
        if (noteTable) {
            noteTable.querySelectorAll('tr').forEach((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 4 && !row.style.fontWeight?.includes('700')) {
                    const type = cells[0].textContent?.trim() || '';
                    const calculation = cells[1].textContent?.trim() || '';
                    const points = this._parseSignedNumber(cells[2].textContent || '');
                    const isMaxed = cells[3].textContent?.includes('✓') || false;

                    if (type && type !== 'TOTAL') {
                        noteDetails.push({
                            type,
                            calculation,
                            points,
                            isMaxed,
                        });
                    }
                }
            });
        }

        return {
            parkNote,
            experienceGained,
            dailyResult,
            noteDetails,
        };
    }

    /**
     * Returns default summary data.
     */
    private _getDefaultSummaryData(): SummaryData {
        return {
            parkNote: 0,
            experienceGained: 0,
            dailyResult: 0,
            noteDetails: [],
        };
    }

    /**
     * Extracts a single park's data.
     * @param parkElement - The park card element.
     * @returns Park day record.
     */
    private _extractParkData(parkElement: Element): ParkDayRecord {
        // Parse park name and status
        const name = this._getText(parkElement, NEW_DAY_SELECTORS.PARK_NAME);
        const statusElement = parkElement.querySelector(NEW_DAY_SELECTORS.PARK_STATUS);
        const statusText = statusElement?.textContent?.trim().toLowerCase() || '';
        const status: 'open' | 'closed' | 'unknown' =
            statusText.includes('ouvert') ? 'open' : statusText.includes('fermé') ? 'closed' : 'unknown';
        const hasWarning = !!parkElement.querySelector(NEW_DAY_SELECTORS.PARK_WARNING);

        // Parse final result
        const resultText = this._getText(parkElement, NEW_DAY_SELECTORS.PARK_RESULT);
        const finalResult = this._parseSignedNumber(resultText);

        return {
            name,
            status,
            hasWarning,
            finalResult,
            hr: this._extractHRData(parkElement),
            visitors: this._extractVisitorsData(parkElement),
            attractions: this._extractAttractionsData(parkElement),
            spectacles: this._extractSpectaclesData(parkElement),
            restaurants: this._extractRestaurantsData(parkElement),
            boutiques: this._extractBoutiquesData(parkElement),
            taxes: this._extractTaxesData(parkElement),
            otherExpenses: this._extractOtherExpensesData(parkElement),
            summary: this._extractSummaryData(parkElement),
        };
    }

    /**
     * Extracts all data from the new day recap section.
     * @returns Complete day record or null if recap not found.
     */
    public extract(): DayRecord | null {
        const recapContent = document.querySelector(NEW_DAY_SELECTORS.RECAP_CONTENT);
        if (!recapContent) {
            return null;
        }

        // Parse message
        const message = this._getText(recapContent, NEW_DAY_SELECTORS.RECAP_MESSAGE);
        const daysRemaining = this._parseDaysRemaining(message);

        // Parse all parks
        const parkElements = recapContent.querySelectorAll(NEW_DAY_SELECTORS.PARK_CARD);
        const parks: ParkDayRecord[] = [];
        let totalResult = 0;

        parkElements.forEach((parkElement) => {
            const parkData = this._extractParkData(parkElement);
            parks.push(parkData);
            totalResult += parkData.finalResult;
        });

        return {
            id: this._generateId(),
            timestamp: Date.now(),
            daysRemaining,
            message,
            parks,
            totalResult,
        };
    }
}
