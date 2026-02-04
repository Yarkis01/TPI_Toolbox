import { DayRecord, ParkDayRecord } from './interfaces';

/**
 * Manages detailed exports of history data.
 * Generates comprehensive JSON and multi-file CSV ZIP exports.
 */
export class ExportManager {
    /**
     * Generates a detailed JSON export with all data.
     * @param records - The records to export.
     * @returns JSON string with complete data.
     */
    public exportDetailedJson(records: DayRecord[]): string {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalRecords: records.length,
            records: records.map((record) => ({
                ...record,
                formattedDate: new Date(record.timestamp).toLocaleString('fr-FR'),
            })),
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Generates multiple CSV files as a ZIP archive.
     * @param records - The records to export.
     * @returns Promise resolving to a Blob containing the ZIP file.
     */
    public async exportCsvZip(records: DayRecord[]): Promise<Blob> {
        const csvFiles = this._generateAllCsvFiles(records);
        return this._createZipBlob(csvFiles);
    }

    /**
     * Generates all CSV files for the export.
     */
    private _generateAllCsvFiles(
        records: DayRecord[],
    ): Map<string, string> {
        const files = new Map<string, string>();

        // 1. Summary CSV - Overview of each day
        files.set('01_resume_journees.csv', this._generateSummaryCsv(records));

        // 2. Parks summary CSV
        files.set('02_resume_parcs.csv', this._generateParksSummaryCsv(records));

        // 3. Visitors CSV
        files.set('03_visiteurs.csv', this._generateVisitorsCsv(records));

        // 4. Attractions CSV
        files.set('04_attractions.csv', this._generateAttractionsCsv(records));

        // 5. Spectacles CSV
        files.set('05_spectacles.csv', this._generateSpectaclesCsv(records));

        // 6. Restaurants CSV
        files.set('06_restaurants.csv', this._generateRestaurantsCsv(records));

        // 7. Boutiques CSV
        files.set('07_boutiques.csv', this._generateBoutiquesCsv(records));

        // 8. HR CSV
        files.set('08_ressources_humaines.csv', this._generateHrCsv(records));

        // 9. Finances CSV
        files.set('09_finances.csv', this._generateFinancesCsv(records));

        // 10. Park notes details CSV
        files.set('10_details_notes.csv', this._generateNoteDetailsCsv(records));

        return files;
    }

    /**
     * Creates a ZIP blob from multiple files.
     * Uses a simple ZIP implementation without external dependencies.
     */
    private async _createZipBlob(
        files: Map<string, string>,
    ): Promise<Blob> {
        // Simple ZIP file structure
        const encoder = new TextEncoder();
        const zipParts: Uint8Array[] = [];
        const centralDirectory: Uint8Array[] = [];
        let offset = 0;

        const fileEntries = Array.from(files.entries());

        for (const [filename, content] of fileEntries) {
            const filenameBytes = encoder.encode(filename);
            const contentBytes = encoder.encode(content);

            // Local file header
            const localHeader = this._createLocalFileHeader(
                filenameBytes,
                contentBytes,
            );
            zipParts.push(localHeader);
            zipParts.push(filenameBytes);
            zipParts.push(contentBytes);

            // Central directory entry
            const centralEntry = this._createCentralDirectoryEntry(
                filenameBytes,
                contentBytes,
                offset,
            );
            centralDirectory.push(centralEntry);

            offset += localHeader.length + filenameBytes.length + contentBytes.length;
        }

        // Add central directory
        const centralDirStart = offset;
        for (const entry of centralDirectory) {
            zipParts.push(entry);
            offset += entry.length;
        }

        // End of central directory
        const endRecord = this._createEndOfCentralDirectory(
            fileEntries.length,
            offset - centralDirStart,
            centralDirStart,
        );
        zipParts.push(endRecord);

        // Concatenate all parts into a single ArrayBuffer
        const totalLength = zipParts.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);
        let position = 0;
        for (const part of zipParts) {
            result.set(part, position);
            position += part.length;
        }

        return new Blob([result.buffer], { type: 'application/zip' });
    }

    /**
     * Creates a local file header for ZIP.
     */
    private _createLocalFileHeader(
        filename: Uint8Array,
        content: Uint8Array,
    ): Uint8Array {
        const header = new Uint8Array(30);
        const view = new DataView(header.buffer);

        // Local file header signature
        view.setUint32(0, 0x04034b50, true);
        // Version needed
        view.setUint16(4, 20, true);
        // General purpose bit flag
        view.setUint16(6, 0, true);
        // Compression method (0 = stored)
        view.setUint16(8, 0, true);
        // File time
        view.setUint16(10, 0, true);
        // File date
        view.setUint16(12, 0, true);
        // CRC-32 (simplified - would need actual calculation for real ZIP)
        view.setUint32(14, this._crc32(content), true);
        // Compressed size
        view.setUint32(18, content.length, true);
        // Uncompressed size
        view.setUint32(22, content.length, true);
        // File name length
        view.setUint16(26, filename.length, true);
        // Extra field length
        view.setUint16(28, 0, true);

        return header;
    }

    /**
     * Creates a central directory entry for ZIP.
     */
    private _createCentralDirectoryEntry(
        filename: Uint8Array,
        content: Uint8Array,
        localHeaderOffset: number,
    ): Uint8Array {
        const entry = new Uint8Array(46 + filename.length);
        const view = new DataView(entry.buffer);

        // Central directory file header signature
        view.setUint32(0, 0x02014b50, true);
        // Version made by
        view.setUint16(4, 20, true);
        // Version needed to extract
        view.setUint16(6, 20, true);
        // General purpose bit flag
        view.setUint16(8, 0, true);
        // Compression method
        view.setUint16(10, 0, true);
        // File time
        view.setUint16(12, 0, true);
        // File date
        view.setUint16(14, 0, true);
        // CRC-32
        view.setUint32(16, this._crc32(content), true);
        // Compressed size
        view.setUint32(20, content.length, true);
        // Uncompressed size
        view.setUint32(24, content.length, true);
        // File name length
        view.setUint16(28, filename.length, true);
        // Extra field length
        view.setUint16(30, 0, true);
        // File comment length
        view.setUint16(32, 0, true);
        // Disk number start
        view.setUint16(34, 0, true);
        // Internal file attributes
        view.setUint16(36, 0, true);
        // External file attributes
        view.setUint32(38, 0, true);
        // Relative offset of local header
        view.setUint32(42, localHeaderOffset, true);

        // Copy filename
        entry.set(filename, 46);

        return entry;
    }

    /**
     * Creates end of central directory record.
     */
    private _createEndOfCentralDirectory(
        fileCount: number,
        centralDirSize: number,
        centralDirOffset: number,
    ): Uint8Array {
        const record = new Uint8Array(22);
        const view = new DataView(record.buffer);

        // End of central directory signature
        view.setUint32(0, 0x06054b50, true);
        // Number of this disk
        view.setUint16(4, 0, true);
        // Disk where central directory starts
        view.setUint16(6, 0, true);
        // Number of central directory records on this disk
        view.setUint16(8, fileCount, true);
        // Total number of central directory records
        view.setUint16(10, fileCount, true);
        // Size of central directory
        view.setUint32(12, centralDirSize, true);
        // Offset of start of central directory
        view.setUint32(16, centralDirOffset, true);
        // Comment length
        view.setUint16(20, 0, true);

        return record;
    }

    /**
     * Simple CRC-32 implementation.
     */
    private _crc32(data: Uint8Array): number {
        let crc = 0xffffffff;
        const table = this._getCrc32Table();

        for (let i = 0; i < data.length; i++) {
            crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
        }

        return (crc ^ 0xffffffff) >>> 0;
    }

    /**
     * Gets CRC-32 lookup table.
     */
    private _getCrc32Table(): Uint32Array {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            }
            table[i] = c;
        }
        return table;
    }

    // ==================== CSV GENERATORS ====================

    /**
     * Generates summary CSV.
     */
    private _generateSummaryCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Timestamp',
            'Jours restants',
            'Nombre de parcs',
            'Résultat total',
        ];

        const rows = records.map((r) => [
            `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`,
            r.timestamp,
            r.daysRemaining,
            r.parks.length,
            r.totalResult,
        ].join(','));

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates parks summary CSV.
     */
    private _generateParksSummaryCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Jours restants',
            'Nom du parc',
            'Statut',
            'Avertissement',
            'Visiteurs totaux',
            'Note du parc',
            'XP gagnée',
            'Résultat journalier',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                rows.push([
                    date,
                    r.daysRemaining,
                    `"${p.name}"`,
                    p.status,
                    p.hasWarning ? 'Oui' : 'Non',
                    p.visitors.totalVisitors,
                    p.summary.parkNote,
                    p.summary.experienceGained,
                    p.finalResult,
                ].join(','));
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates visitors CSV.
     */
    private _generateVisitorsCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Visiteurs totaux',
            'Adultes',
            'Enfants',
            'Visiteurs voiture',
            'Visiteurs transport',
            'Parking occupé',
            'Parking disponible',
            'Parking libre',
            'Capacité totale',
            'Bonus sécurité',
            'Propreté (%)',
            'Bonus propreté',
            'Revenu adultes',
            'Revenu enfants',
            'Revenu entrées total',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                const v = p.visitors;
                rows.push([
                    date,
                    `"${p.name}"`,
                    v.totalVisitors,
                    v.adults,
                    v.children,
                    v.visitorsByCar,
                    v.visitorsByTransport,
                    v.parkingOccupied,
                    v.parkingAvailable,
                    v.parkingFree,
                    v.totalCapacity,
                    v.securityCapacityBonus,
                    v.cleanliness,
                    v.cleanlinessBonus,
                    v.adultRevenue,
                    v.childRevenue,
                    v.totalEntryRevenue,
                ].join(','));
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates attractions CSV.
     */
    private _generateAttractionsCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Zone',
            'Attraction',
            'Capacité',
            'Coût/jour',
            'Temps attente (min)',
            'Statut attente',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.attractions.attractions.forEach((a) => {
                    rows.push([
                        date,
                        `"${p.name}"`,
                        `"${a.zone || 'Sans zone'}"`,
                        `"${a.name}"`,
                        a.capacity,
                        a.costPerDay,
                        a.waitTime,
                        a.waitTimeStatus,
                    ].join(','));
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates spectacles CSV.
     */
    private _generateSpectaclesCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Zone',
            'Spectacle',
            'Type',
            'Capacité',
            'Visiteurs par show',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                if (p.spectacles) {
                    p.spectacles.spectacles.forEach((s) => {
                        rows.push([
                            date,
                            `"${p.name}"`,
                            `"${s.zone || 'Sans zone'}"`,
                            `"${s.name}"`,
                            `"${s.type}"`,
                            s.capacity,
                            s.visitorsPerShow,
                        ].join(','));
                    });
                }
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates restaurants CSV.
     */
    private _generateRestaurantsCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Zone',
            'Restaurant',
            'Capacité',
            'Visiteurs servis',
            'Revenus',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.restaurants.restaurants.forEach((rest) => {
                    rows.push([
                        date,
                        `"${p.name}"`,
                        `"${rest.zone || 'Sans zone'}"`,
                        `"${rest.name}"`,
                        rest.capacity,
                        rest.visitorsServed,
                        rest.revenue,
                    ].join(','));
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates boutiques CSV.
     */
    private _generateBoutiquesCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Zone',
            'Boutique',
            'Capacité',
            'Visiteurs servis',
            'Détail ventes',
            'Revenus',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.boutiques.boutiques.forEach((b) => {
                    rows.push([
                        date,
                        `"${p.name}"`,
                        `"${b.zone || 'Sans zone'}"`,
                        `"${b.name}"`,
                        b.capacity,
                        b.visitorsServed,
                        `"${b.salesDetail.replace(/"/g, '""')}"`,
                        b.revenue,
                    ].join(','));
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates HR CSV.
     */
    private _generateHrCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Employés disponibles',
            'Masse salariale',
            'Total RH',
            'Résultat journalier RH',
            'Mouvements employés',
            'Changements équipes',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                const hr = p.hr;
                const movements = hr.employeeMovements
                    .map((m) => `${m.name} (${m.role}) ${m.action}`)
                    .join('; ');
                const changes = hr.teamStateChanges.join('; ');

                rows.push([
                    date,
                    `"${p.name}"`,
                    hr.availableEmployees,
                    hr.salary,
                    hr.totalHR,
                    hr.dailyResult,
                    `"${movements}"`,
                    `"${changes}"`,
                ].join(','));
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates finances CSV.
     */
    private _generateFinancesCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Revenu entrées',
            'Revenu restaurants (brut)',
            'Revenu restaurants (net)',
            'Coût matières premières',
            'Coût électricité restaurants',
            'Revenu boutiques (brut)',
            'Revenu boutiques (net)',
            'Coût produits boutiques',
            'Coût attractions',
            'Coût électricité attractions',
            'Coût spectacles',
            'Masse salariale',
            'Ville',
            'Taux taxe (%)',
            'Montant taxes',
            'Taux holding (%)',
            'Montant holding',
            'Résultat journalier',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                rows.push([
                    date,
                    `"${p.name}"`,
                    p.visitors.totalEntryRevenue,
                    p.restaurants.totalRevenue,
                    p.restaurants.netRevenue,
                    p.restaurants.rawMaterialsCost,
                    p.restaurants.electricityCost,
                    p.boutiques.totalRevenue,
                    p.boutiques.netRevenue,
                    p.boutiques.productsCost,
                    p.attractions.totalCost,
                    p.attractions.electricityCost,
                    p.spectacles?.totalCost || 0,
                    p.hr.salary,
                    `"${p.taxes.cityName}"`,
                    p.taxes.taxRate,
                    p.taxes.taxAmount,
                    p.otherExpenses.holdingFeeRate,
                    p.otherExpenses.holdingFeeAmount,
                    p.finalResult,
                ].join(','));
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Generates note details CSV.
     */
    private _generateNoteDetailsCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Type',
            'Calcul',
            'Points',
            'Maximum atteint',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.summary.noteDetails.forEach((n) => {
                    rows.push([
                        date,
                        `"${p.name}"`,
                        `"${n.type}"`,
                        `"${n.calculation.replace(/"/g, '""')}"`,
                        n.points,
                        n.isMaxed ? 'Oui' : 'Non',
                    ].join(','));
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }
}
