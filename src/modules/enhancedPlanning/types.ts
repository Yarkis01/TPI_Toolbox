/**
 * Type definitions for window.planningData provided by the game page.
 */

export interface IPlanningEmployee {
    id: number;
    name: string;
    formation: number;
    horaire_planning: Record<string, number>;
    lieu_planning: Record<string, number>;
    salaire: number;
    disponibilite: string;
}

export interface IPlanningBoutique {
    id: number;
    name: string;
    statut: string;
    capacite_day: number;
    min_vendeur: number;
    max_vendeur: number;
}

export interface IPlanningRestaurant {
    id: number;
    name: string;
    statut: string;
    capacite_day: number;
    min_cuisinier: number;
    max_cuisinier: number;
}

export interface IPlanningSpectacle {
    id: number;
    name: string;
    statut: string;
    type_salle: string;
    capacite_salle: string;
    min_artiste: number;
    max_artiste: number;
    capacite_base: number;
}

export interface IPlanningAttraction {
    id: number;
    name: string;
    statut: string;
    operateur_minimum: number;
    operateur_maximum: number;
    capacite_heure: number;
}

export interface IPlanningData {
    horaires: Record<string, number>;
    attractions: IPlanningAttraction[];
    techniciens: IPlanningEmployee[];
    operateursGuichet: IPlanningEmployee[];
    nombreGuichetsPhysiques: number;
    agentsSecurite: IPlanningEmployee[];
    nombrePointsSecurite: number;
    cuisiniers: IPlanningEmployee[];
    restaurants: IPlanningRestaurant[];
    vendeurs: IPlanningEmployee[];
    boutiques: IPlanningBoutique[];
    operateursAttraction: IPlanningEmployee[];
    artistes: IPlanningEmployee[];
    spectacles: IPlanningSpectacle[];
    nextDay: number;
}

/**
 * Type for a location with min/max employee requirements.
 */
export interface ILocationInfo {
    id: number;
    name: string;
    minEmployees: number;
    maxEmployees: number;
}
