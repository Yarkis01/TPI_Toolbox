/**
 * Selectors for the operating system module.
 */
export const SELECTORS = {
    APP_LAYOUT: '.app-layout',
    DESKTOP_CONTAINER: 'os-desktop',
} as const;

/** Elements hidden inside each iframe to clean up the in-game navigation. */
export const IFRAME_HIDDEN_SELECTORS = ['.app-mobile-header', '#app-sidebar-drawer'] as const;

/**
 * Application IDs for the operating system module.
 */
export const APP_IDS = {
    PROFILE: 'profile',
    MAIL: 'mail',
    SHOP: 'shop',
    MY_PARK: 'my_park',
    NEXT_DAY: 'next_day',
    RANKING: 'ranking',
    TOOLS: 'tools',
} as const;

/**
 * Configuration for the operating system module.
 */
export const OS_CONFIG = {
    ID: 'operating_system',
    NAME: "Système d'exploitation",
    DESCRIPTION: "Transforme l'interface graphique en un système d'exploitation.",
    URL_PROFILE: 'https://play.themeparkindustries.com/dashboard/bureau.php',
    URL_MAIL: 'https://play.themeparkindustries.com/dashboard/mail.php',
    URL_SHOP: 'https://play.themeparkindustries.com/dashboard/boutique.php',
    URL_MY_PARK: 'https://play.themeparkindustries.com/dashboard/park/overview.php',
    URL_NEXT_DAY: 'https://play.themeparkindustries.com/dashboard/new_day.php',
    URL_RANKING: 'https://play.themeparkindustries.com/dashboard/classement.php',
    STYLES: {
        DESKTOP_BG: 'linear-gradient(135deg, #050505 0%, #061f10 100%)',
        DESKTOP_BG_COLOR: '#0f1110',
    },
    DOCK: {
        LABELS: {
            PROFILE: 'Bureau',
            MAIL: 'Mail',
            SHOP: 'Boutique',
            MY_PARK: 'Mes parcs',
            NEXT_DAY: 'Jour suivant',
            RANKING: 'Classement',
            TOOLS: 'TPI Toolbox',
        },
    },
} as const;

/**
 * Settings keys for the operating system module.
 */
export const SETTINGS_KEYS = {
    REDUCE_EFFECTS: 'os_reduce_effects',
    RESTORE_SESSION: 'os_restore_session',
    SESSION_STATE: 'os_session_state',
} as const;

/**
 * Interface for a saved window state.
 */
export interface SavedWindowState {
    appId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isMaximized: boolean;
}

/**
 * Interface for the saved session state.
 */
export interface SessionState {
    windows: SavedWindowState[];
    focusedAppId: string | null;
}
