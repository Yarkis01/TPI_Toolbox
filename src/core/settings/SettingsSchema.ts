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
];
