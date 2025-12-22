/**
 * Application-related constant informations.
 */
export const APP_INFORMATIONS = {
    APP_NAME: 'TPI Toolbox',
    // Build-time version injected by Vite (fallback to 0.0.0 for safety).
    APP_VERSION: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
    APP_AUTHOR: 'Yarkis01 & MarcusIsLion',
    APP_GITHUB_URL: 'https://github.com/Yarkis01/TPI_Toolbox',
} as const;
