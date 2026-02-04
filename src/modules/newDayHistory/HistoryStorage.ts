import { DayRecord } from './interfaces';
import { STORAGE_CONFIG } from './constants';

/**
 * Service for storing and retrieving day history records.
 */
export class HistoryStorage {
    private _storageKey: string;
    private _maxRecords: number;

    /**
     * Creates an instance of HistoryStorage.
     * @param storageKey - The localStorage key to use.
     * @param maxRecords - Maximum number of records to keep.
     */
    constructor(
        storageKey: string = STORAGE_CONFIG.STORAGE_KEY,
        maxRecords: number = STORAGE_CONFIG.MAX_RECORDS,
    ) {
        this._storageKey = storageKey;
        this._maxRecords = maxRecords;
    }

    /**
     * Retrieves all stored day records.
     * @returns Array of day records, sorted by timestamp (newest first).
     */
    public getAll(): DayRecord[] {
        try {
            const data = localStorage.getItem(this._storageKey);
            if (!data) {
                return [];
            }
            const records: DayRecord[] = JSON.parse(data);
            return records.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to retrieve history:', error);
            return [];
        }
    }

    /**
     * Retrieves a specific day record by ID.
     * @param id - The record ID.
     * @returns The day record or null if not found.
     */
    public getById(id: string): DayRecord | null {
        const records = this.getAll();
        return records.find((r) => r.id === id) || null;
    }

    /**
     * Saves a new day record.
     * @param record - The day record to save.
     */
    public save(record: DayRecord): void {
        try {
            const records = this.getAll();

            // Check if record with same ID already exists
            const existingIndex = records.findIndex((r) => r.id === record.id);
            if (existingIndex !== -1) {
                records[existingIndex] = record;
            } else {
                records.unshift(record);
            }

            // Trim to max records
            const trimmedRecords = records.slice(0, this._maxRecords);

            localStorage.setItem(this._storageKey, JSON.stringify(trimmedRecords));
        } catch (error) {
            console.error('Failed to save history record:', error);
        }
    }

    /**
     * Deletes a specific day record by ID.
     * @param id - The record ID to delete.
     * @returns True if deleted, false if not found.
     */
    public delete(id: string): boolean {
        try {
            const records = this.getAll();
            const filteredRecords = records.filter((r) => r.id !== id);

            if (filteredRecords.length === records.length) {
                return false;
            }

            localStorage.setItem(this._storageKey, JSON.stringify(filteredRecords));
            return true;
        } catch (error) {
            console.error('Failed to delete history record:', error);
            return false;
        }
    }

    /**
     * Clears all stored records.
     */
    public clear(): void {
        try {
            localStorage.removeItem(this._storageKey);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }

    /**
     * Gets the number of stored records.
     * @returns The count of records.
     */
    public count(): number {
        return this.getAll().length;
    }

    /**
     * Exports all records as JSON string.
     * @returns JSON string of all records.
     */
    public exportAsJson(): string {
        const records = this.getAll();
        return JSON.stringify(records, null, 2);
    }

    /**
     * Exports all records as CSV string.
     * @returns CSV string with summary data.
     */
    public exportAsCsv(): string {
        const records = this.getAll();

        const headers = [
            'Date',
            'Jours restants',
            'Résultat total',
            'Parcs',
        ];

        const rows = records.map((record) => {
            const date = new Date(record.timestamp).toLocaleString('fr-FR');
            const parkNames = record.parks.map((p) => p.name).join(' | ');
            return [
                `"${date}"`,
                record.daysRemaining,
                record.totalResult,
                `"${parkNames}"`,
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Exports detailed CSV with per-park data.
     * @returns Detailed CSV string.
     */
    public exportDetailedCsv(): string {
        const records = this.getAll();

        const headers = [
            'Date',
            'Jours restants',
            'Parc',
            'Statut',
            'Visiteurs',
            'Adultes',
            'Enfants',
            'Revenu entrées',
            'Revenu restaurants',
            'Revenu boutiques',
            'Coût attractions',
            'Coût spectacles',
            'Masse salariale',
            'Taxes',
            'Redevance holding',
            'Note du parc',
            'XP gagnée',
            'Résultat journalier',
        ];

        const rows: string[] = [];

        records.forEach((record) => {
            const date = new Date(record.timestamp).toLocaleString('fr-FR');

            record.parks.forEach((park) => {
                rows.push(
                    [
                        `"${date}"`,
                        record.daysRemaining,
                        `"${park.name}"`,
                        park.status,
                        park.visitors.totalVisitors,
                        park.visitors.adults,
                        park.visitors.children,
                        park.visitors.totalEntryRevenue,
                        park.restaurants.netRevenue,
                        park.boutiques.netRevenue,
                        park.attractions.totalCost,
                        park.spectacles?.totalCost || 0,
                        park.hr.salary,
                        park.taxes.taxAmount,
                        park.otherExpenses.holdingFeeAmount,
                        park.summary.parkNote,
                        park.summary.experienceGained,
                        park.finalResult,
                    ].join(','),
                );
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }
}
