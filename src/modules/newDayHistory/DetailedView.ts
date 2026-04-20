import { DayRecord, ParkDayRecord, RawAttractionRecord } from './interfaces';

/**
 * Generates detailed HTML view for a day record.
 */
export class DetailedView {
    /**
     * Formats a number with French locale (absolute value).
     */
    private _formatNumber(value: number): string {
        return Math.abs(value).toLocaleString('fr-FR');
    }

    /**
     * Formats a currency value with color and optional sign.
     */
    private _formatCurrency(value: number, showSign = true): string {
        const color = value >= 0 ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)';
        const sign = showSign ? (value >= 0 ? '+' : '-') : value < 0 ? '-' : '';
        return `<span style="color: ${color};">${sign}${this._formatNumber(value)}&nbsp;€</span>`;
    }

    /**
     * Returns color based on wait time in minutes.
     */
    private _waitTimeColor(minutes: number): string {
        if (minutes <= 15) return 'rgb(46, 204, 113)';
        if (minutes <= 30) return 'rgb(255, 165, 0)';
        return 'rgb(231, 76, 60)';
    }

    /**
     * Generates the complete detailed view for a record.
     */
    public generateDetailedView(record: DayRecord): string {
        return `
            <div class="tpi-detailed-view">
                <div class="tpi-detailed-view__header">
                    <h3>📅 ${new Date(record.timestamp).toLocaleString('fr-FR')}</h3>
                    <p>${record.daysRemaining} jour(s) restant(s) · Résultat total : ${this._formatCurrency(record.totalResult)}</p>
                </div>
                ${record.parks.map((park) => this._generateParkView(park)).join('')}
            </div>
        `;
    }

    /**
     * Generates detailed view for a single park.
     */
    public generateParkDetailedView(
        park: ParkDayRecord,
        recordInfo?: { timestamp: number; daysRemaining: number },
    ): string {
        const headerInfo = recordInfo
            ? `<h3>📅 ${new Date(recordInfo.timestamp).toLocaleString('fr-FR')}</h3>
               <p>${recordInfo.daysRemaining} jour(s) restant(s)</p>`
            : '';

        return `
            <div class="tpi-detailed-view">
                <div class="tpi-detailed-view__header">
                    ${headerInfo}
                    <h2 style="margin: 0.5rem 0 0 0; color: #fff;">${park.name}</h2>
                </div>
                ${this._generateParkView(park)}
            </div>
        `;
    }

    /**
     * Generates the view for a single park.
     */
    private _generateParkView(park: ParkDayRecord): string {
        const statusClass = park.status === 'open' ? 'open' : 'closed';
        const statusText = park.status === 'open' ? 'Ouvert' : 'Fermé';

        const eventsSection = park.events.length > 0 ? this._generateEventsSection(park) : '';
        const seasonSection =
            park.seasonDecoration.bonus > 0 || park.seasonDecoration.hasPlan
                ? this._generateSeasonSection(park)
                : '';

        return `
            <article class="tpi-detailed-park">
                <div class="tpi-detailed-park__header">
                    <div>
                        <span class="tpi-detailed-park__name">${park.name}</span>
                        <span class="tpi-detailed-park__status tpi-detailed-park__status--${statusClass}">${statusText}</span>
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${park.cityName}, ${park.countryName}</span>
                        ${park.hasWarning ? '<span class="tpi-detailed-park__warning">⚠️</span>' : ''}
                    </div>
                    <div class="tpi-detailed-park__result">
                        Résultat : ${this._formatCurrency(park.finalResult)}
                    </div>
                </div>

                <div class="tpi-detailed-park__sections">
                    ${eventsSection}
                    ${this._generateVisitorsSection(park)}
                    ${this._generateAttractionsSection(park)}
                    ${park.spectacles ? this._generateSpectaclesSection(park) : ''}
                    ${this._generateRestaurantsSection(park)}
                    ${this._generateBoutiquesSection(park)}
                    ${this._generateFinancesSection(park)}
                    ${seasonSection}
                    ${this._generateNoteSection(park)}
                    ${this._generateEmployeesSection(park)}
                </div>
            </article>
        `;
    }

    /**
     * Generates the events section (daily alerts, inspections, anomalies).
     */
    private _generateEventsSection(park: ParkDayRecord): string {
        if (park.events.length === 0) return '';

        const eventBlocks = park.events
            .map(
                (evt) => `
                <div class="tpi-detailed-section__subsection">
                    <p class="tpi-detailed-section__subtitle">${evt.subtitle}</p>
                    <ul>${evt.items.map((item) => `<li>${item}</li>`).join('')}</ul>
                </div>
            `,
            )
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">📋</span>
                    <h4>Événements du jour</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    ${eventBlocks}
                </div>
            </div>
        `;
    }

    /**
     * Generates the visitors section.
     */
    private _generateVisitorsSection(park: ParkDayRecord): string {
        const v = park.visitors;
        const e = park.entrance;

        const entranceInfo =
            e.throughputHour > 0
                ? `<li>Débit entrée : <strong>${this._formatNumber(e.throughputHour)} pers./h</strong> (${this._formatNumber(e.activeBooths)} caisses)</li>`
                : '';

        const cleanlinessNote = park.cleanliness.noteExplanation
            ? `<li>Propreté : <strong>${park.cleanliness.percent}%</strong> — ${park.cleanliness.noteExplanation}</li>`
            : `<li>Propreté : <strong>${park.cleanliness.percent}%</strong></li>`;

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🚪</span>
                    <h4>Visiteurs</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Fréquentation :</p>
                        <ul>
                            <li>Visiteurs totaux : <strong>${this._formatNumber(v.total)}</strong></li>
                            <li>Adultes : ${this._formatNumber(v.adults)} · Enfants : ${this._formatNumber(v.children)}</li>
                            <li>En voiture : ${this._formatNumber(v.byCar)} · En transport : ${this._formatNumber(v.byTransport)}</li>
                            ${entranceInfo}
                        </ul>
                    </div>
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Revenus entrées :</p>
                        <ul>
                            <li>Adultes : ${this._formatCurrency(v.revenueAdults, false)}</li>
                            <li>Enfants : ${this._formatCurrency(v.revenueChildren, false)}</li>
                            <li><strong>Total entrées : ${this._formatCurrency(v.revenueTotal, false)}</strong></li>
                        </ul>
                    </div>
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Parking :</p>
                        <ul>
                            <li>Places totales : ${this._formatNumber(v.parkingTotal)} · Places occupées : ${this._formatNumber(v.parkingOccupied)}</li>
                        </ul>
                    </div>
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Propreté :</p>
                        <ul>
                            ${cleanlinessNote}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates the attractions section.
     */
    private _generateAttractionsSection(park: ParkDayRecord): string {
        const a = park.attractions;
        const showFastPass = a.fastPassTotal > 0;

        const byZone = new Map<string, RawAttractionRecord[]>();
        for (const attr of a.open) {
            const zone = attr.zone_name || 'Sans zone';
            if (!byZone.has(zone)) byZone.set(zone, []);
            byZone.get(zone)!.push(attr);
        }

        const colCount = showFastPass ? 8 : 6;

        const coasterCount = park.noteDetail.coasterCount;
        const flatrideCount = park.noteDetail.flatrideCount;

        const tableRows = Array.from(byZone.entries())
            .map(
                ([zone, attrs]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="${colCount}">${zone}</td>
                </tr>
                ${attrs
                    .map(
                        (attr) => `
                    <tr>
                        <td>${attr.name}</td>
                        <td>${attr.type}</td>
                        <td>${this._formatNumber(attr.capacite_reelle)}</td>
                        <td style="color: ${this._waitTimeColor(attr.wait_time)};">${attr.wait_time} min</td>
                        <td>${this._formatNumber(attr.visitors_per_hour)}</td>
                        <td>${this._formatNumber(attr.electricity_cost)}&nbsp;€</td>
                        ${showFastPass ? `<td>${this._formatNumber(attr.hype ?? 0)}</td>` : ''}
                        ${showFastPass ? `<td>${this._formatCurrency(attr.fast_pass_revenue ?? 0, false)}</td>` : ''}
                    </tr>
                `,
                    )
                    .join('')}
            `,
            )
            .join('');

        const inWorks =
            a.inWorks.length > 0
                ? `<div class="tpi-detailed-section__subsection">
                    <p class="tpi-detailed-section__subtitle">En travaux :</p>
                    <ul>${a.inWorks.map((w) => `<li>${w.name}</li>`).join('')}</ul>
                   </div>`
                : '';

        const maintenanceBonusList =
            a.maintenanceBonus.length > 0
                ? `<div class="tpi-detailed-section__subsection">
                    <p class="tpi-detailed-section__subtitle">Attractions en bon état (bonus maintenance) :</p>
                    <ul>${a.maintenanceBonus.map((m) => `<li>${m.name}</li>`).join('')}</ul>
                   </div>`
                : '';

        const duplicatePenaltyInfo =
            a.duplicatePenalty > 0
                ? `· Pénalité doublons : ${this._formatCurrency(-a.duplicatePenalty)}`
                : '';

        const fastPassInfo = showFastPass
            ? `· Fast-pass total : ${this._formatCurrency(a.fastPassTotal, false)}`
            : '';

        const technicianInfo = a.technicians.hasShortage
            ? `<p class="tpi-detailed-section__info" style="color: rgb(231, 76, 60);">
                    ⚠️ Techniciens insuffisants : ${a.technicians.count}/${a.technicians.capacity} (manque ${a.technicians.missing})
                   </p>`
            : a.technicians.count > 0
              ? `<p class="tpi-detailed-section__info">Techniciens : ${a.technicians.count} (capacité ${a.technicians.capacity})</p>`
              : '';

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🎢</span>
                    <h4>Attractions</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${a.open.length} attraction(s) ouverte(s) :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Attraction</th>
                                    <th>Type</th>
                                    <th>Capacité réelle</th>
                                    <th>Temps attente</th>
                                    <th>Visiteurs/h</th>
                                    <th>Coût élec.</th>
                                    ${showFastPass ? '<th>Hype</th>' : ''}
                                    ${showFastPass ? '<th>Fast-pass (€)</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                    <p class="tpi-detailed-section__info">
                        Ratio : ${coasterCount} coasters / ${flatrideCount} flatrides
                        ${park.noteDetail.balanceBonus > 0 ? `· <span style="color: rgb(46, 204, 113);">+${this._formatNumber(park.noteDetail.balanceBonus)} pts bonus</span>` : ''}
                        · Bonus temps d'attente : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(a.waitTimeBonus)} pts</span>
                        · Électricité totale : ${this._formatCurrency(-a.electricityTotal)}
                        ${duplicatePenaltyInfo}
                        ${fastPassInfo}
                    </p>
                    ${technicianInfo}
                    ${maintenanceBonusList}
                    ${inWorks}
                </div>
            </div>
        `;
    }

    /**
     * Generates the spectacles section.
     */
    private _generateSpectaclesSection(park: ParkDayRecord): string {
        const s = park.spectacles;
        if (!s) return '';

        const byZone = new Map<string, typeof s.open>();
        for (const spec of s.open) {
            const zone = spec.zone_name || 'Sans zone';
            if (!byZone.has(zone)) byZone.set(zone, []);
            byZone.get(zone)!.push(spec);
        }

        const tableRows = Array.from(byZone.entries())
            .map(
                ([zone, specs]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="5">${zone}</td>
                </tr>
                ${specs
                    .map(
                        (spec) => `
                    <tr>
                        <td>${spec.name}</td>
                        <td>${spec.spectacle}</td>
                        <td>${this._formatNumber(spec.capacite_reelle)}</td>
                        <td>${this._formatNumber(spec.visitors_per_show)}</td>
                        <td>${this._formatNumber(spec.prix_jour)}&nbsp;€</td>
                    </tr>
                `,
                    )
                    .join('')}
            `,
            )
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🎭</span>
                    <h4>Spectacles</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${s.open.length} spectacle(s) ouvert(s) :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Spectacle</th>
                                    <th>Type</th>
                                    <th>Capacité réelle</th>
                                    <th>Visiteurs/show</th>
                                    <th>Coût/jour</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                    <p class="tpi-detailed-section__info">Coût total spectacles : ${this._formatCurrency(-s.totalCost)}</p>
                </div>
            </div>
        `;
    }

    /**
     * Generates the restaurants section.
     */
    private _generateRestaurantsSection(park: ParkDayRecord): string {
        const r = park.restaurants;
        const hasRevenue = r.open.some((rest) => rest.revenue !== undefined);
        const hasVisitors = r.open.some((rest) => rest.visitorsServed !== undefined);

        const colCount = 3 + (hasRevenue ? 1 : 0) + (hasVisitors ? 1 : 0);

        const byZone = new Map<string, typeof r.open>();
        for (const rest of r.open) {
            const zone = rest.zone_name || 'Sans zone';
            if (!byZone.has(zone)) byZone.set(zone, []);
            byZone.get(zone)!.push(rest);
        }

        const tableRows = Array.from(byZone.entries())
            .map(
                ([zone, rests]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="${colCount}">${zone}</td>
                </tr>
                ${rests
                    .map(
                        (rest) => `
                    <tr>
                        <td>${rest.name}</td>
                        <td>${rest.type}</td>
                        <td>${this._formatNumber(rest.capacite_day)}</td>
                        ${hasRevenue ? `<td>${rest.revenue !== undefined ? this._formatCurrency(rest.revenue, false) : '—'}</td>` : ''}
                        ${hasVisitors ? `<td>${rest.visitorsServed !== undefined ? this._formatNumber(rest.visitorsServed) : '—'}</td>` : ''}
                    </tr>
                `,
                    )
                    .join('')}
            `,
            )
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🍽️</span>
                    <h4>Restaurants</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${r.open.length} restaurant(s) ouvert(s) :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Restaurant</th>
                                    <th>Type</th>
                                    <th>Capacité/jour</th>
                                    ${hasRevenue ? '<th>Revenus</th>' : ''}
                                    ${hasVisitors ? '<th>Visiteurs servis</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                    <p class="tpi-detailed-section__info">
                        Électricité totale : ${this._formatCurrency(-r.electricityTotal)}
                        · Bonus : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(r.bonus)}&nbsp;€</span>
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Generates the boutiques section.
     */
    private _generateBoutiquesSection(park: ParkDayRecord): string {
        const b = park.boutiques;
        const hasRevenue = b.open.some((bout) => bout.revenue !== undefined);
        const hasCost = b.open.some((bout) => bout.cost !== undefined);
        const hasVisitors = b.open.some((bout) => bout.visitorsServed !== undefined);
        const hasMargin = hasRevenue && hasCost;

        const colCount =
            3 +
            (hasRevenue ? 1 : 0) +
            (hasCost ? 1 : 0) +
            (hasMargin ? 1 : 0) +
            (hasVisitors ? 1 : 0);

        const byZone = new Map<string, typeof b.open>();
        for (const bout of b.open) {
            const zone = bout.zone_name || 'Sans zone';
            if (!byZone.has(zone)) byZone.set(zone, []);
            byZone.get(zone)!.push(bout);
        }

        const tableRows = Array.from(byZone.entries())
            .map(
                ([zone, bouts]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="${colCount}">${zone}</td>
                </tr>
                ${bouts
                    .map((bout) => {
                        const margin =
                            bout.revenue !== undefined && bout.cost !== undefined
                                ? bout.revenue - bout.cost
                                : undefined;
                        return `
                    <tr>
                        <td>${bout.name}</td>
                        <td>${bout.type}</td>
                        <td>${this._formatNumber(bout.capacite_day)}</td>
                        ${hasRevenue ? `<td>${bout.revenue !== undefined ? this._formatCurrency(bout.revenue, false) : '—'}</td>` : ''}
                        ${hasCost ? `<td>${bout.cost !== undefined ? this._formatCurrency(-bout.cost) : '—'}</td>` : ''}
                        ${hasMargin ? `<td>${margin !== undefined ? this._formatCurrency(margin) : '—'}</td>` : ''}
                        ${hasVisitors ? `<td>${bout.visitorsServed !== undefined ? this._formatNumber(bout.visitorsServed) : '—'}</td>` : ''}
                    </tr>
                `;
                    })
                    .join('')}
            `,
            )
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🛒</span>
                    <h4>Boutiques</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${b.open.length} boutique(s) ouverte(s) :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Boutique</th>
                                    <th>Type</th>
                                    <th>Capacité/jour</th>
                                    ${hasRevenue ? '<th>Revenus</th>' : ''}
                                    ${hasCost ? '<th>Coût produits</th>' : ''}
                                    ${hasMargin ? '<th>Marge</th>' : ''}
                                    ${hasVisitors ? '<th>Visiteurs servis</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates the finances section with all revenue / cost lines.
     */
    private _generateFinancesSection(park: ParkDayRecord): string {
        const taxTotal = park.taxes.reduce((s, t) => s + t.amount, 0);
        const taxLines = park.taxes
            .map((t) => `<li>${t.label} : ${this._formatCurrency(-t.amount)}</li>`)
            .join('');

        const payroll = park.payroll;
        const payrollBreakdown = `
            <ul style="margin-top: 0.25rem; padding-left: 1.5rem; font-size: 0.9em;">
                ${payroll.costGuichet > 0 ? `<li>Guichet : ${this._formatCurrency(-payroll.costGuichet)}</li>` : ''}
                ${payroll.costSecurite > 0 ? `<li>Sécurité : ${this._formatCurrency(-payroll.costSecurite)}</li>` : ''}
                ${payroll.costEntretien > 0 ? `<li>Entretien : ${this._formatCurrency(-payroll.costEntretien)}</li>` : ''}
                ${payroll.costOperateursAttraction > 0 ? `<li>Opérateurs attractions : ${this._formatCurrency(-payroll.costOperateursAttraction)}</li>` : ''}
                ${payroll.costOperateursSpectacle > 0 ? `<li>Opérateurs spectacles : ${this._formatCurrency(-payroll.costOperateursSpectacle)}</li>` : ''}
                ${payroll.entranceStaffCost > 0 ? `<li>Personnel entrée : ${this._formatCurrency(-payroll.entranceStaffCost)}</li>` : ''}
                ${payroll.hrShortage > 0 ? `<li style="color: rgb(231, 76, 60);">Pénalité manque RH : ${this._formatCurrency(-payroll.hrShortage)}</li>` : ''}
            </ul>
        `;

        const transport = park.transport;
        const transportLines =
            transport.lines.length > 0
                ? `<ul style="margin-top: 0.25rem; padding-left: 1.5rem; font-size: 0.9em;">
                    ${transport.lines.map((l) => `<li>${l.label} (${l.units}) : brut ${this._formatCurrency(-l.grossCost)} / remb. ${this._formatCurrency(l.reimbursement, false)}</li>`).join('')}
                   </ul>`
                : '';

        const fastPassLine =
            park.attractions.fastPassTotal > 0
                ? `<li>Revenus fast-pass : ${this._formatCurrency(park.attractions.fastPassTotal, false)}</li>`
                : '';

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">💰</span>
                    <h4>Finances</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <ul>
                        <li>Revenus entrées : ${this._formatCurrency(park.visitors.revenueTotal, false)}</li>
                        ${fastPassLine}
                        <li>
                            Masse salariale : ${this._formatCurrency(-payroll.salaryTotal)}
                            ${payrollBreakdown}
                        </li>
                        <li>Électricité attractions : ${this._formatCurrency(-park.attractions.electricityTotal)}</li>
                        ${park.spectacles ? `<li>Coût spectacles : ${this._formatCurrency(-park.spectacles.totalCost)}</li>` : ''}
                        <li>
                            Transports (net) : ${this._formatCurrency(-transport.netCost)}
                            ${transportLines}
                        </li>
                        <li>Amélioration zones : ${this._formatCurrency(-park.zoneImprovements.totalCost)}</li>
                        <li><strong>Résultat brut (avant taxes) : ${this._formatCurrency(park.benefitBeforeTaxes)}</strong></li>
                    </ul>
                    <p class="tpi-detailed-section__subtitle">Taxes :</p>
                    <ul>
                        ${taxLines}
                        <li><strong>Total taxes : ${this._formatCurrency(-taxTotal)}</strong></li>
                    </ul>
                    <footer class="tpi-detailed-section__footer">
                        <div><strong>Résultat net final : ${this._formatCurrency(park.finalResult)}</strong></div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the season decoration section.
     */
    private _generateSeasonSection(park: ParkDayRecord): string {
        const sd = park.seasonDecoration;

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🎄</span>
                    <h4>Décoration saisonnière</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <ul>
                        <li>Bonus saison : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(sd.bonus)}</span> / max ${this._formatNumber(sd.max)}</li>
                        <li>Plan de décoration : ${sd.hasPlan ? '<span style="color: rgb(46, 204, 113);">Oui</span>' : 'Non'}</li>
                        ${sd.recapFr ? `<li>${sd.recapFr}</li>` : ''}
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Generates the note section.
     */
    private _generateNoteSection(park: ParkDayRecord): string {
        const nd = park.noteDetail;

        const zonesTable =
            park.thematisationZones.length > 0
                ? `
                <p class="tpi-detailed-section__subtitle">Thématisation par zone :</p>
                <div class="tpi-detailed-table-wrapper">
                    <table class="tpi-detailed-table">
                        <thead>
                            <tr>
                                <th>Zone</th>
                                <th>Score</th>
                                <th>Attractions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${park.thematisationZones
                                .map(
                                    (z) => `
                                <tr>
                                    <td>${z.zoneName}</td>
                                    <td>${this._formatNumber(z.score)}</td>
                                    <td>${z.attractionCount}</td>
                                </tr>
                            `,
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
            `
                : '';

        const cleanlinessExplanation = park.cleanliness.noteExplanation
            ? `<li style="font-style: italic; color: var(--text-secondary);">${park.cleanliness.noteExplanation}</li>`
            : '';

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">⭐</span>
                    <h4>Note du parc</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <div class="tpi-detailed-summary-grid">
                        <div class="tpi-detailed-summary-item">
                            <p class="tpi-detailed-summary-item__label">Note finale :</p>
                            <p class="tpi-detailed-summary-item__value">${this._formatNumber(nd.final)}</p>
                        </div>
                        <div class="tpi-detailed-summary-item">
                            <p class="tpi-detailed-summary-item__label">Note brute :</p>
                            <p class="tpi-detailed-summary-item__value">${this._formatNumber(nd.subtotalBeforeThemeSeason)}</p>
                        </div>
                        <div class="tpi-detailed-summary-item">
                            <p class="tpi-detailed-summary-item__label">XP gagnée :</p>
                            <p class="tpi-detailed-summary-item__value">${this._formatNumber(park.experienceGain)} pts</p>
                        </div>
                    </div>
                    <ul>
                        <li>Propreté ${nd.cleanlinessPercent}% : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(nd.cleanlinessNoteDelta)} pts</span></li>
                        ${cleanlinessExplanation}
                        <li>Sécurité entrée : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(nd.entranceSecurityDelta)} pts</span></li>
                        <li>Bonus temps d'attente : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(nd.attractionsWaitBonus)} pts</span></li>
                        <li>Balance coasters/flatrides (${nd.coasterCount}/${nd.flatrideCount}) : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(nd.balanceBonus)} pts</span></li>
                        <li>Bonus thématisation : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(nd.themeBonus)} pts</span></li>
                        <li>Bonus saison : <span style="color: rgb(46, 204, 113);">+${this._formatNumber(nd.seasonBonus)} pts</span></li>
                    </ul>
                    ${zonesTable}
                </div>
            </div>
        `;
    }

    /**
     * Generates the employees (RH) section if there are movements.
     */
    private _generateEmployeesSection(park: ParkDayRecord): string {
        const { wentOff, backToWork } = park.employees;
        if (wentOff.length === 0 && backToWork.length === 0) return '';

        const wentOffList =
            wentOff.length > 0
                ? `<div class="tpi-detailed-section__col">
                    <p class="tpi-detailed-section__subtitle">Partis :</p>
                    <ul>${wentOff.map((e) => `<li>${e.name} (${e.poste})</li>`).join('')}</ul>
                   </div>`
                : '';

        const backToWorkList =
            backToWork.length > 0
                ? `<div class="tpi-detailed-section__col">
                    <p class="tpi-detailed-section__subtitle">Revenus :</p>
                    <ul>${backToWork.map((e) => `<li>${e.name} (${e.poste})</li>`).join('')}</ul>
                   </div>`
                : '';

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">👥</span>
                    <h4>Ressources humaines</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <div class="tpi-detailed-section__grid">
                        ${wentOffList}
                        ${backToWorkList}
                    </div>
                </div>
            </div>
        `;
    }
}
