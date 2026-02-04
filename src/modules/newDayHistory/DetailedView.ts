import { ParkDayRecord, DayRecord } from './interfaces';

/**
 * Generates detailed HTML view for a day record, replicating the original recap display.
 */
export class DetailedView {
    /**
     * Formats a number with French locale.
     */
    private _formatNumber(value: number): string {
        return Math.abs(value).toLocaleString('fr-FR');
    }

    /**
     * Formats a currency value with color.
     */
    private _formatCurrency(value: number, showSign = true): string {
        const color = value >= 0 ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)';
        const sign = showSign ? (value >= 0 ? '+' : '-') : (value < 0 ? '-' : '');
        return `<span style="color: ${color};">${sign}${this._formatNumber(value)}&nbsp;€</span>`;
    }

    /**
     * Get wait time color based on status.
     */
    private _getWaitTimeColor(status: 'good' | 'warning' | 'bad'): string {
        switch (status) {
            case 'good':
                return 'rgb(46, 204, 113)';
            case 'warning':
                return 'rgb(255, 165, 0)';
            case 'bad':
                return 'rgb(231, 76, 60)';
        }
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
     * @param park - The park record to display.
     * @param recordInfo - Optional record info (timestamp, daysRemaining).
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

        return `
            <article class="tpi-detailed-park">
                <div class="tpi-detailed-park__header">
                    <div>
                        <span class="tpi-detailed-park__name">${park.name}</span>
                        <span class="tpi-detailed-park__status tpi-detailed-park__status--${statusClass}">${statusText}</span>
                        ${park.hasWarning ? '<span class="tpi-detailed-park__warning">⚠️</span>' : ''}
                    </div>
                    <div class="tpi-detailed-park__result">
                        Résultat : ${this._formatCurrency(park.finalResult)}
                    </div>
                </div>

                <div class="tpi-detailed-park__sections">
                    ${this._generateHRSection(park)}
                    ${this._generateVisitorsSection(park)}
                    ${this._generateAttractionsSection(park)}
                    ${park.spectacles ? this._generateSpectaclesSection(park) : ''}
                    ${this._generateRestaurantsSection(park)}
                    ${this._generateBoutiquesSection(park)}
                    ${this._generateTaxesSection(park)}
                    ${this._generateOtherExpensesSection(park)}
                    ${this._generateSummarySection(park)}
                </div>
            </article>
        `;
    }

    /**
     * Generates the HR section.
     */
    private _generateHRSection(park: ParkDayRecord): string {
        const hr = park.hr;
        const hasMovements = hr.employeeMovements.length > 0;
        const hasChanges = hr.teamStateChanges.length > 0;

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">👥</span>
                    <h4>Gestion des ressources humaines</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <div class="tpi-detailed-section__grid">
                        <div class="tpi-detailed-section__col">
                            <p class="tpi-detailed-section__subtitle">Mouvements employé</p>
                            ${hasMovements
                ? `<ul>${hr.employeeMovements.map((m) => `<li>${m.name} (${m.role}) ${m.action}</li>`).join('')}</ul>`
                : '<p class="tpi-detailed-section__empty">Aucun mouvement</p>'}
                        </div>
                        <div class="tpi-detailed-section__col">
                            <p class="tpi-detailed-section__subtitle">Etat des équipes</p>
                            ${hasChanges
                ? `<ul>${hr.teamStateChanges.map((c) => `<li>${c}</li>`).join('')}</ul>`
                : '<p class="tpi-detailed-section__empty">Aucun changement</p>'}
                        </div>
                    </div>
                    <p class="tpi-detailed-section__info">Nombre d'employé disponible : ${hr.availableEmployees}</p>
                    <div class="tpi-detailed-section__finance">
                        <p class="tpi-detailed-section__subtitle">Recette / dépenses :</p>
                        <ul>
                            <li>Masse salariale : ${this._formatCurrency(-hr.salary)}</li>
                        </ul>
                    </div>
                    <footer class="tpi-detailed-section__footer">
                        <div>Total ressources humaines : ${this._formatCurrency(hr.totalHR)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(hr.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the visitors section.
     */
    private _generateVisitorsSection(park: ParkDayRecord): string {
        const v = park.visitors;

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🚪</span>
                    <h4>Visiteurs, entrées et parking</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Parking :</p>
                        <p>${this._formatNumber(v.parkingOccupied)} place(s) occupée(s) / ${this._formatNumber(v.parkingAvailable)} place(s) disponible(s) (${this._formatNumber(v.parkingFree)} libre(s))</p>
                    </div>
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Entrées :</p>
                        <ul>
                            <li>Capacité totale : ${this._formatNumber(v.totalCapacity)} pers./jour</li>
                            ${v.securityCapacityBonus > 0
                ? `<li>Capacité des points de sécurité : <span style="color: rgb(46, 204, 113);">+${v.securityCapacityBonus} points</span></li>`
                : ''}
                        </ul>
                    </div>
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Visiteurs :</p>
                        <ul>
                            <li>Visiteurs potentiels en voiture : ${this._formatNumber(v.visitorsByCar)} pers.</li>
                            <li>Visiteurs potentiels arrivés par transport : ${this._formatNumber(v.visitorsByTransport)} pers.</li>
                            <li>Visiteurs entrés aujourd'hui : <strong>${this._formatNumber(v.totalVisitors)} pers.</strong></li>
                            <li>Adultes : ${this._formatNumber(v.adults)} · Enfants : ${this._formatNumber(v.children)}</li>
                        </ul>
                    </div>
                    <div class="tpi-detailed-section__subsection">
                        <p class="tpi-detailed-section__subtitle">Avis des visiteurs :</p>
                        <ul>
                            <li>Propreté du parc : ${v.cleanliness} %${v.cleanlinessBonus > 0 ? ` <span style="color: rgb(46, 204, 113);">(+${v.cleanlinessBonus} points)</span>` : ''}</li>
                        </ul>
                    </div>
                    <div class="tpi-detailed-section__finance">
                        <p class="tpi-detailed-section__subtitle">Recette / dépenses :</p>
                        <ul>
                            <li>Revenu des entrées adultes : ${this._formatCurrency(v.adultRevenue)}</li>
                            <li>Revenu des entrées enfant : ${this._formatCurrency(v.childRevenue)}</li>
                        </ul>
                    </div>
                    <footer class="tpi-detailed-section__footer">
                        <div>Total des entrées : ${this._formatCurrency(v.totalEntryRevenue)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(v.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the attractions section.
     */
    private _generateAttractionsSection(park: ParkDayRecord): string {
        const a = park.attractions;

        // Group attractions by zone
        const attractionsByZone = new Map<string, typeof a.attractions>();
        a.attractions.forEach((attr) => {
            const zone = attr.zone || 'Sans zone';
            if (!attractionsByZone.has(zone)) {
                attractionsByZone.set(zone, []);
            }
            attractionsByZone.get(zone)!.push(attr);
        });

        const attractionsTable = Array.from(attractionsByZone.entries())
            .map(([zone, attrs]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="4">${zone}</td>
                </tr>
                ${attrs.map((attr) => `
                    <tr>
                        <td>${attr.name}</td>
                        <td>${this._formatNumber(attr.capacity)}</td>
                        <td>${this._formatNumber(attr.costPerDay)}&nbsp;€</td>
                        <td style="color: ${this._getWaitTimeColor(attr.waitTimeStatus)};">${attr.waitTime} min</td>
                    </tr>
                `).join('')}
            `)
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🎢</span>
                    <h4>Attractions</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${a.openCount} attractions ouvertes :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Attraction</th>
                                    <th>Capacité réelle (pers./h)</th>
                                    <th>Coût / jour</th>
                                    <th>Temps d'attente</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${attractionsTable}
                            </tbody>
                        </table>
                    </div>
                    ${a.waitTimePenalty > 0
                ? `<p class="tpi-detailed-section__alert" style="color: rgb(231, 76, 60);">-${a.waitTimePenalty} points sur la note du parc à cause de temps d'attente trop long.</p>`
                : ''}
                    <p class="tpi-detailed-section__info">
                        Ratio coaster/flat : ${a.coasterCount} coasters / ${a.flatrideCount} flatrides 
                        ${a.ratioBonus > 0 ? `<span style="color: rgb(46, 204, 113);">+${a.ratioBonus} points</span>` : ''}
                        ${a.themingBonus > 0 ? ` · Bonus score de thématisation : <span style="color: rgb(46, 204, 113);">+${a.themingBonus} points</span>` : ''}
                    </p>
                    ${a.works.length > 0 ? `
                        <div class="tpi-detailed-section__subsection">
                            <p class="tpi-detailed-section__subtitle">Attractions en travaux :</p>
                            <ul>
                                ${a.works.map((w) => `<li>${w.name} - ${w.daysRemaining} jours restants</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="tpi-detailed-section__finance">
                        <p class="tpi-detailed-section__subtitle">Recette / dépenses :</p>
                        <ul>
                            <li>Coût en électricité : ${this._formatCurrency(-a.electricityCost)}</li>
                        </ul>
                    </div>
                    <footer class="tpi-detailed-section__footer">
                        <div>Total coût des attractions : ${this._formatCurrency(-a.totalCost)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(a.dailyResult)}</div>
                    </footer>
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

        // Group spectacles by zone
        const spectaclesByZone = new Map<string, typeof s.spectacles>();
        s.spectacles.forEach((spec) => {
            const zone = spec.zone || 'Sans zone';
            if (!spectaclesByZone.has(zone)) {
                spectaclesByZone.set(zone, []);
            }
            spectaclesByZone.get(zone)!.push(spec);
        });

        const spectaclesTable = Array.from(spectaclesByZone.entries())
            .map(([zone, specs]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="4">${zone}</td>
                </tr>
                ${specs.map((spec) => `
                    <tr>
                        <td>${spec.name}</td>
                        <td>${spec.type}</td>
                        <td>${this._formatNumber(spec.capacity)}</td>
                        <td>${this._formatNumber(spec.visitorsPerShow)}</td>
                    </tr>
                `).join('')}
            `)
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🎭</span>
                    <h4>Spectacles</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${s.openCount} spectacles ouverts :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Spectacle</th>
                                    <th>Type de spectacle</th>
                                    <th>Capacité réelle</th>
                                    <th>Visiteurs par show</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${spectaclesTable}
                            </tbody>
                        </table>
                    </div>
                    <div class="tpi-detailed-section__finance">
                        <p class="tpi-detailed-section__subtitle">Recette / dépenses :</p>
                        <ul>
                            <li>Coût des spectacles : ${this._formatCurrency(-s.totalCost)}</li>
                        </ul>
                    </div>
                    <footer class="tpi-detailed-section__footer">
                        <div>Total coût des spectacles : ${this._formatCurrency(-s.totalCost)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(s.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the restaurants section.
     */
    private _generateRestaurantsSection(park: ParkDayRecord): string {
        const r = park.restaurants;

        // Group restaurants by zone
        const restaurantsByZone = new Map<string, typeof r.restaurants>();
        r.restaurants.forEach((rest) => {
            const zone = rest.zone || 'Sans zone';
            if (!restaurantsByZone.has(zone)) {
                restaurantsByZone.set(zone, []);
            }
            restaurantsByZone.get(zone)!.push(rest);
        });

        const restaurantsTable = Array.from(restaurantsByZone.entries())
            .map(([zone, rests]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="4">${zone}</td>
                </tr>
                ${rests.map((rest) => `
                    <tr>
                        <td>${rest.name}</td>
                        <td>${this._formatNumber(rest.capacity)}</td>
                        <td>${this._formatNumber(rest.visitorsServed)}</td>
                        <td>${this._formatCurrency(rest.revenue)}</td>
                    </tr>
                `).join('')}
            `)
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🍽️</span>
                    <h4>Restaurants</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${r.openCount} restaurants ouverts :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Restaurant</th>
                                    <th>Capacité réelle</th>
                                    <th>Visiteurs servis</th>
                                    <th>Revenus</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${restaurantsTable}
                            </tbody>
                        </table>
                    </div>
                    ${r.capacityWarnings.length > 0 ? `
                        <div class="tpi-detailed-section__alert" style="color: rgb(255, 165, 0);">
                            ${r.capacityWarnings.join('<br>')}
                        </div>
                    ` : ''}
                    ${r.works.length > 0 ? `
                        <div class="tpi-detailed-section__subsection">
                            <p class="tpi-detailed-section__subtitle">Restaurants en travaux :</p>
                            <ul>
                                ${r.works.map((w) => `<li>${w.name} - ${w.daysRemaining} jours restants</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="tpi-detailed-section__finance">
                        <p class="tpi-detailed-section__subtitle">Recette / dépenses :</p>
                        <ul>
                            <li>Coût en électricité : ${this._formatCurrency(-r.electricityCost)}</li>
                            <li>Coût des matières premières total : ${this._formatCurrency(-r.rawMaterialsCost)}</li>
                            <li>Revenus des restaurants : ${this._formatCurrency(r.totalRevenue)}</li>
                        </ul>
                    </div>
                    <footer class="tpi-detailed-section__footer">
                        <div>Revenus des restaurants : ${this._formatCurrency(r.netRevenue)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(r.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the boutiques section.
     */
    private _generateBoutiquesSection(park: ParkDayRecord): string {
        const b = park.boutiques;

        // Group boutiques by zone
        const boutiquesByZone = new Map<string, typeof b.boutiques>();
        b.boutiques.forEach((bout) => {
            const zone = bout.zone || 'Sans zone';
            if (!boutiquesByZone.has(zone)) {
                boutiquesByZone.set(zone, []);
            }
            boutiquesByZone.get(zone)!.push(bout);
        });

        const boutiquesTable = Array.from(boutiquesByZone.entries())
            .map(([zone, bouts]) => `
                <tr class="tpi-detailed-table__zone-row">
                    <td colspan="5">${zone}</td>
                </tr>
                ${bouts.map((bout) => `
                    <tr>
                        <td>${bout.name}</td>
                        <td>${this._formatNumber(bout.capacity)}</td>
                        <td>${this._formatNumber(bout.visitorsServed)}</td>
                        <td style="font-size: 0.85rem;">${bout.salesDetail}</td>
                        <td>${this._formatCurrency(bout.revenue)}</td>
                    </tr>
                `).join('')}
            `)
            .join('');

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🛒</span>
                    <h4>Boutiques</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">${b.openCount} boutique(s) ouverte(s) :</p>
                    <div class="tpi-detailed-table-wrapper">
                        <table class="tpi-detailed-table">
                            <thead>
                                <tr>
                                    <th>Boutique</th>
                                    <th>Capacité réelle</th>
                                    <th>Visiteurs servis</th>
                                    <th>Détail des ventes</th>
                                    <th>Chiffre d'affaires</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${boutiquesTable}
                            </tbody>
                        </table>
                    </div>
                    <div class="tpi-detailed-section__finance">
                        <p class="tpi-detailed-section__subtitle">Recette / dépenses :</p>
                        <ul>
                            <li>Coût d'achat des produits total : ${this._formatCurrency(-b.productsCost)}</li>
                            <li>Revenus des boutiques : ${this._formatCurrency(b.totalRevenue)}</li>
                        </ul>
                    </div>
                    <footer class="tpi-detailed-section__footer">
                        <div>Revenus des boutiques : ${this._formatCurrency(b.netRevenue)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(b.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the taxes section.
     */
    private _generateTaxesSection(park: ParkDayRecord): string {
        const t = park.taxes;

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">🏛️</span>
                    <h4>Taxes</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">Taxes de la ville de ${t.cityName}</p>
                    <ul>
                        <li>Taxe sur les bénéfices (${t.taxRate}%) : ${this._formatCurrency(-t.taxAmount)}</li>
                    </ul>
                    <footer class="tpi-detailed-section__footer">
                        <div>Coût des taxes : ${this._formatCurrency(-t.taxAmount)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(t.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the other expenses section.
     */
    private _generateOtherExpensesSection(park: ParkDayRecord): string {
        const o = park.otherExpenses;

        return `
            <div class="tpi-detailed-section">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">💸</span>
                    <h4>Autres dépenses</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <p class="tpi-detailed-section__subtitle">Dépenses :</p>
                    <ul>
                        <li>Redevance holding (${o.holdingFeeRate}%) : ${this._formatCurrency(-o.holdingFeeAmount)}</li>
                    </ul>
                    <footer class="tpi-detailed-section__footer">
                        <div>Autres dépenses : ${this._formatCurrency(-o.holdingFeeAmount)}</div>
                        <div>Résultat journalier : ${this._formatCurrency(o.dailyResult)}</div>
                    </footer>
                </div>
            </div>
        `;
    }

    /**
     * Generates the summary section with note details.
     */
    private _generateSummarySection(park: ParkDayRecord): string {
        const s = park.summary;

        const noteDetailsTable = s.noteDetails.length > 0 ? `
            <div class="tpi-detailed-section__note-details">
                <p class="tpi-detailed-section__subtitle" style="cursor: pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                    ▼ Détail de la note de parc
                </p>
                <div style="display: none;">
                    <table class="tpi-detailed-table tpi-detailed-table--note">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Calcul</th>
                                <th>Note</th>
                                <th>Maximum atteint</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${s.noteDetails.map((n) => `
                                <tr>
                                    <td>${n.type}</td>
                                    <td style="color: var(--text-secondary);">${n.calculation}</td>
                                    <td style="font-weight: 600; color: ${n.points >= 0 ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)'};">
                                        ${n.points >= 0 ? '+' : ''}${this._formatNumber(n.points)}
                                    </td>
                                    <td style="text-align: center; color: ${n.isMaxed ? 'rgb(46, 204, 113)' : 'var(--text-secondary)'}; font-weight: ${n.isMaxed ? '700' : '400'};">
                                        ${n.isMaxed ? '✓' : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                            <tr class="tpi-detailed-table__total-row">
                                <td>TOTAL</td>
                                <td>Nouvelle note du parc</td>
                                <td style="color: rgb(46, 204, 113);">${this._formatNumber(s.parkNote)}</td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '';

        return `
            <div class="tpi-detailed-section tpi-detailed-section--summary">
                <header class="tpi-detailed-section__header">
                    <span class="tpi-detailed-section__icon">⭐</span>
                    <h4>Récapitulatif de la journée</h4>
                </header>
                <div class="tpi-detailed-section__content">
                    <div class="tpi-detailed-summary-grid">
                        <div class="tpi-detailed-summary-item">
                            <p class="tpi-detailed-summary-item__label">Note de parc :</p>
                            <p class="tpi-detailed-summary-item__value">${this._formatNumber(s.parkNote)}</p>
                        </div>
                        <div class="tpi-detailed-summary-item">
                            <p class="tpi-detailed-summary-item__label">Expérience gagnée :</p>
                            <p class="tpi-detailed-summary-item__value">${this._formatNumber(s.experienceGained)} pts</p>
                        </div>
                        <div class="tpi-detailed-summary-item">
                            <p class="tpi-detailed-summary-item__label">Résultat de la journée :</p>
                            <p class="tpi-detailed-summary-item__value">${this._formatCurrency(s.dailyResult)}</p>
                        </div>
                    </div>
                    ${noteDetailsTable}
                </div>
            </div>
        `;
    }
}
