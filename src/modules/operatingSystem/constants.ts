/**
 * Selectors for the operating system module.
 */
export const SELECTORS = {
    LEFT_MENU: '#left-menu',
    GAME_CONTAINER: 'main.play-main',
    DESKTOP_CONTAINER: 'os-desktop',
} as const;

/**
 * Application IDs for the operating system module.
 */
export const APP_IDS = {
    PROFILE: 'profile',
    BROWSER: 'web',
    MAIL: 'mail',
    INVEST: 'invest',
    MY_PARK: 'my_park',
    CHAT: 'chat',
    MARKET: 'market',
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
    URL_PROFILE: 'https://www.themeparkindustries.com/tpiv4/game/monbureau.php',
    URL_BROWSER: 'https://www.themeparkindustries.com/tpiv4/game/park/fake/gogole.php',
    URL_MAIL: 'https://www.themeparkindustries.com/tpiv4/game/mail.php',
    URL_INVEST: 'https://www.themeparkindustries.com/tpiv4/game/invest.php',
    URL_MY_PARK: 'https://www.themeparkindustries.com/tpiv4/game/park/overview.php',
    STYLES: {
        DESKTOP_BG: 'linear-gradient(135deg, #050505 0%, #061f10 100%)',
        DESKTOP_BG_COLOR: '#0f1110',
        CHAT_BG: '#202020',
    },
    DOCK: {
        LABELS: {
            PROFILE: 'Bureau',
            BROWSER: 'Gogole',
            MAIL: 'Mail',
            INVEST: 'Investissements',
            MY_PARK: 'Mes parcs',
            CHAT: 'Chat',
            MARKET: 'Boutique',
            TOOLS: 'TPI Toolbox',
        },
    },
} as const;
