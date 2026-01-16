/**
 * Selectors for the operating system module.
 */
export const SELECTORS = {
    LEFT_MENU: "#left-menu",
    GAME_CONTAINER: "main.play-main",
    DESKTOP_CONTAINER: "os-desktop"
} as const;

/**
 * Application IDs for the operating system module.
 */
export const APP_IDS = {
    PROFILE: 'profile',
    GAMES: 'games',
    WEB: 'web',
    MAIL: 'mail',
    CHAT: 'chat',
    MARKET: 'market',
    SETTINGS: 'settings',
    TOOLS: 'tools',
} as const;

/**
 * Configuration for the operating system module.
 */
export const OS_CONFIG = {
    ID: 'operating_system',
    NAME: "Système d'exploitation",
    DESCRIPTION: "Transforme l'interface graphique en un système d'exploitation.",
    URL_CHAT: 'https://www.themeparkindustries.com/tpiv4/game/chat.php',
    STYLES: {
        DESKTOP_BG: "linear-gradient(135deg, #050505 0%, #061f10 100%)",
        DESKTOP_BG_COLOR: "#0f1110",
        CHAT_BG: '#202020'
    },
    DOCK: {
        LABELS: {
            PROFILE: 'Profil',
            GAMES: 'Jeux',
            WEB: 'Navigateur',
            MAIL: 'Messages',
            CHAT: 'Chat',
            MARKET: 'Boutique',
            SETTINGS: 'Paramètres',
            TOOLS: 'Outils',
        }
    }
} as const;