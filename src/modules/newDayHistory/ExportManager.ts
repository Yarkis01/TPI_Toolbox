import { DayRecord } from './interfaces';

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
            version: '2.0',
            totalRecords: records.length,
            records: records.map((record) => ({
                ...record,
                formattedDate: new Date(record.timestamp).toLocaleString('fr-FR'),
            })),
        };
        return JSON.stringify(exportData, null);
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
    private _generateAllCsvFiles(records: DayRecord[]): Map<string, string> {
        const files = new Map<string, string>();

        files.set('01_resume_journees.csv', this._generateSummaryCsv(records));
        files.set('02_resume_parcs.csv', this._generateParksSummaryCsv(records));
        files.set('03_visiteurs.csv', this._generateVisitorsCsv(records));
        files.set('04_finances.csv', this._generateFinancesCsv(records));
        files.set('05_attractions.csv', this._generateAttractionsCsv(records));
        files.set('06_spectacles.csv', this._generateSpectaclesCsv(records));
        files.set('07_restaurants.csv', this._generateRestaurantsCsv(records));
        files.set('08_boutiques.csv', this._generateBoutiquesCsv(records));
        files.set('09_taxes.csv', this._generateTaxesCsv(records));
        files.set('10_notes.csv', this._generateNotesCsv(records));

        return files;
    }

    /**
     * Creates a ZIP blob from multiple files.
     * Uses a simple ZIP implementation without external dependencies.
     */
    private async _createZipBlob(files: Map<string, string>): Promise<Blob> {
        const encoder = new TextEncoder();
        const zipParts: Uint8Array[] = [];
        const centralDirectory: Uint8Array[] = [];
        let offset = 0;

        const fileEntries = Array.from(files.entries());

        for (const [filename, content] of fileEntries) {
            const filenameBytes = encoder.encode(filename);
            const contentBytes = encoder.encode(content);

            const localHeader = this._createLocalFileHeader(filenameBytes, contentBytes);
            zipParts.push(localHeader);
            zipParts.push(filenameBytes);
            zipParts.push(contentBytes);

            const centralEntry = this._createCentralDirectoryEntry(
                filenameBytes,
                contentBytes,
                offset,
            );
            centralDirectory.push(centralEntry);

            offset += localHeader.length + filenameBytes.length + contentBytes.length;
        }

        const centralDirStart = offset;
        for (const entry of centralDirectory) {
            zipParts.push(entry);
            offset += entry.length;
        }

        const endRecord = this._createEndOfCentralDirectory(
            fileEntries.length,
            offset - centralDirStart,
            centralDirStart,
        );
        zipParts.push(endRecord);

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
    private _createLocalFileHeader(filename: Uint8Array, content: Uint8Array): Uint8Array {
        const header = new Uint8Array(30);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 0, true);
        view.setUint16(8, 0, true);
        view.setUint16(10, 0, true);
        view.setUint16(12, 0, true);
        view.setUint32(14, this._crc32(content), true);
        view.setUint32(18, content.length, true);
        view.setUint32(22, content.length, true);
        view.setUint16(26, filename.length, true);
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

        view.setUint32(0, 0x02014b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 20, true);
        view.setUint16(8, 0, true);
        view.setUint16(10, 0, true);
        view.setUint16(12, 0, true);
        view.setUint16(14, 0, true);
        view.setUint32(16, this._crc32(content), true);
        view.setUint32(20, content.length, true);
        view.setUint32(24, content.length, true);
        view.setUint16(28, filename.length, true);
        view.setUint16(30, 0, true);
        view.setUint16(32, 0, true);
        view.setUint16(34, 0, true);
        view.setUint16(36, 0, true);
        view.setUint32(38, 0, true);
        view.setUint32(42, localHeaderOffset, true);

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

        view.setUint32(0, 0x06054b50, true);
        view.setUint16(4, 0, true);
        view.setUint16(6, 0, true);
        view.setUint16(8, fileCount, true);
        view.setUint16(10, fileCount, true);
        view.setUint32(12, centralDirSize, true);
        view.setUint32(16, centralDirOffset, true);
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
     * 01 — Summary per day.
     */
    private _generateSummaryCsv(records: DayRecord[]): string {
        const headers = ['Date', 'Timestamp', 'Jours restants', 'Jour', 'Nb parcs', 'Résultat total'];

        const rows = records.map((r) =>
            [
                `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`,
                r.timestamp,
                r.daysRemaining,
                r.day,
                r.parks.length,
                r.totalResult,
            ].join(','),
        );

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 02 — Parks summary.
     */
    private _generateParksSummaryCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Jours restants',
            'Parc',
            'Statut',
            'Ville',
            'Pays',
            'Visiteurs',
            'Note',
            'XP',
            'Résultat brut',
            'Résultat net',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                rows.push(
                    [
                        date,
                        r.daysRemaining,
                        `"${p.name}"`,
                        p.status,
                        `"${p.cityName}"`,
                        `"${p.countryName}"`,
                        p.visitors.total,
                        p.parkNote,
                        p.experienceGain,
                        p.benefitBeforeTaxes,
                        p.finalResult,
                    ].join(','),
                );
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 03 — Visitors detail.
     */
    private _generateVisitorsCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Total',
            'Adultes',
            'Enfants',
            'Voiture',
            'Transport',
            'Revenu adultes',
            'Revenu enfants',
            'Revenu total',
            'Parking total',
            'Parking occupé',
            'Propreté (%)',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                const v = p.visitors;
                rows.push(
                    [
                        date,
                        `"${p.name}"`,
                        v.total,
                        v.adults,
                        v.children,
                        v.byCar,
                        v.byTransport,
                        v.revenueAdults,
                        v.revenueChildren,
                        v.revenueTotal,
                        v.parkingTotal,
                        v.parkingOccupied,
                        p.cleanliness,
                    ].join(','),
                );
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 04 — Finances.
     */
    private _generateFinancesCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Revenus entrées',
            'Masse salariale',
            'Élec attractions',
            'Coût spectacles',
            'Transports (net)',
            'Amélioration zones',
            'Résultat avant taxes',
            'Taxes totales',
            'Résultat final',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                const taxTotal = p.taxes.reduce((s, t) => s + t.amount, 0);
                rows.push(
                    [
                        date,
                        `"${p.name}"`,
                        p.visitors.revenueTotal,
                        p.salary,
                        p.attractions.electricityTotal,
                        p.spectacles?.totalCost ?? 0,
                        p.transportCost,
                        p.zoneImprovementsCost,
                        p.benefitBeforeTaxes,
                        taxTotal,
                        p.finalResult,
                    ].join(','),
                );
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 05 — Attractions detail.
     */
    private _generateAttractionsCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Zone',
            'Attraction',
            'Type',
            'Capacité',
            'Temps attente (min)',
            'Pénalité attente',
            'Visiteurs/h',
            'Coût élec',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.attractions.open.forEach((a) => {
                    rows.push(
                        [
                            date,
                            `"${p.name}"`,
                            `"${a.zone_name || 'Sans zone'}"`,
                            `"${a.name}"`,
                            `"${a.type}"`,
                            a.capacite_reelle,
                            a.wait_time,
                            a.wait_time_penalty,
                            a.visitors_per_hour,
                            a.electricity_cost,
                        ].join(','),
                    );
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 06 — Spectacles detail.
     */
    private _generateSpectaclesCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Zone',
            'Spectacle',
            'Type',
            'Capacité',
            'Visiteurs/show',
            'Coût/jour',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                if (p.spectacles) {
                    p.spectacles.open.forEach((s) => {
                        rows.push(
                            [
                                date,
                                `"${p.name}"`,
                                `"${s.zone_name || 'Sans zone'}"`,
                                `"${s.name}"`,
                                `"${s.spectacle}"`,
                                s.capacite_reelle,
                                s.visitors_per_show,
                                s.prix_jour,
                            ].join(','),
                        );
                    });
                }
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 07 — Restaurants detail.
     */
    private _generateRestaurantsCsv(records: DayRecord[]): string {
        const headers = ['Date', 'Parc', 'Zone', 'Restaurant', 'Type', 'Capacité/jour'];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.restaurants.open.forEach((rest) => {
                    rows.push(
                        [
                            date,
                            `"${p.name}"`,
                            `"${rest.zone_name || 'Sans zone'}"`,
                            `"${rest.name}"`,
                            `"${rest.type}"`,
                            rest.capacite_day,
                        ].join(','),
                    );
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 08 — Boutiques detail.
     */
    private _generateBoutiquesCsv(records: DayRecord[]): string {
        const headers = ['Date', 'Parc', 'Zone', 'Boutique', 'Type', 'Capacité/jour'];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.boutiques.open.forEach((b) => {
                    rows.push(
                        [
                            date,
                            `"${p.name}"`,
                            `"${b.zone_name || 'Sans zone'}"`,
                            `"${b.name}"`,
                            `"${b.type}"`,
                            b.capacite_day,
                        ].join(','),
                    );
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 09 — Taxes detail.
     */
    private _generateTaxesCsv(records: DayRecord[]): string {
        const headers = ['Date', 'Parc', 'Type taxe', 'Libellé', 'Montant', 'Détails'];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                p.taxes.forEach((t) => {
                    rows.push(
                        [
                            date,
                            `"${p.name}"`,
                            `"${t.type}"`,
                            `"${t.label.replace(/"/g, '""')}"`,
                            t.amount,
                            `"${t.details.replace(/"/g, '""')}"`,
                        ].join(','),
                    );
                });
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 10 — Notes detail.
     */
    private _generateNotesCsv(records: DayRecord[]): string {
        const headers = [
            'Date',
            'Parc',
            'Note finale',
            'Note brute',
            'Bonus thème',
            'Bonus saison',
            '% propreté',
            'Delta propreté',
            'Delta sécurité',
            'Bonus attente',
            'Nb coasters',
            'Nb flatrides',
            'Bonus balance',
            'Score thématisation',
        ];

        const rows: string[] = [];
        records.forEach((r) => {
            const date = `"${new Date(r.timestamp).toLocaleString('fr-FR')}"`;
            r.parks.forEach((p) => {
                const nd = p.noteDetail;
                rows.push(
                    [
                        date,
                        `"${p.name}"`,
                        nd.final,
                        nd.subtotalBeforeThemeSeason,
                        nd.themeBonus,
                        nd.seasonBonus,
                        nd.cleanlinessPercent,
                        nd.cleanlinessNoteDelta,
                        nd.entranceSecurityDelta,
                        nd.attractionsWaitBonus,
                        nd.coasterCount,
                        nd.flatrideCount,
                        nd.balanceBonus,
                        p.thematisationScore,
                    ].join(','),
                );
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }
}
