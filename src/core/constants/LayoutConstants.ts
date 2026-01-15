/**
 * Layout-related constant selectors.
 */
export const SELECTORS = {
    LINK_TUTORIAL: 'a.game-header__link[href*="tutoriel.php"]',
    DISCORD_BUTTON: 'a.game-header__discord-btn',
    CHAT_BUTTON: 'div.footer__col--chat',
    LOGOUT_BUTTON: 'a.game-header__link[href*="logout.php"]',
    CHAT_OPENED: 'tpi-chat-opened',
    HEADER: 'div.dashboard-welcome',
} as const;

/**
 * Chat iframe configuration constants.
 */
export const CHAT_IFRAME = {
    SRC: 'https://www.themeparkindustries.com/tpiv4/game/chat.php',
    WIDTH: 400,
} as const;

/**
 * Layout-related ID constants.
 */
export const IDS = {
    HEADERS_WIDGETS: 'tpi-header-widgets',
    CHAT_BUTTON: 'tpi-chat-button',
    CHAT_OVERLAY: 'tpi-chat-overlay',
    TOOLBOX_BUTTON: 'tpi-toolbox-button',
    SETTINGS_MODAL: 'tpi-settings-modal',
    UPDATE_TOAST: 'tpi-update-toast',
} as const;

/**
 * Layout-related event constants.
 */
export const EVENTS = {
    CHAT_TOGGLED: 'tpitoolbox:chat:toggled',
    TOOLBOX_TOGGLED: 'tpitoolbox:toolbox:toggled',
} as const;

/**
 * Layout-related string constants.
 */
export const STRINGS = {
    OPEN_CHAT_BUTTON: 'Ouvrir le Chat',
    CLOSE_CHAT_BUTTON: 'Fermer le Chat',
    SAVE_SETTINGS_BUTTON: 'Sauvegarder & Recharger',
} as const;
