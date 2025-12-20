/**
 * Definition of a setting in the toolbox.
 */
export interface SettingDefinition {
    key: string;
    label: string;
    description: string;
    defaultValue: boolean;
}

/**
 * Default settings definitions.
 */
export const SETTINGS_DEF: SettingDefinition[] = [
    {
        key: 'showRideHypeAsText',
        label: 'Afficher la hype des attractions en texte',
        description: 'Au lieu de la barre de hype, afficher la valeur numérique.',
        defaultValue: false,
    },
    {
        key: 'entityStatusColorizer',
        label: 'Coloriseur de statut des entités',
        description: "Colorer les éléments tels que les attractions et boutiques en fonction de leur statut (ouvert, fermé, en travaux, etc…).",
        defaultValue: false,
    }
];
