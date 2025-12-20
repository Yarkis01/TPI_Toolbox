/**
 * Selectors used in the application.
 */
export const SELECTORS = {
    LINK_TUTORIAL: 'a.game-header__link[href*="tutoriel.php"]',
    LOGOUT_BUTTON: 'a.game-header__link[href*="logout.php"]',
    DISCORD_BUTTON: 'a.game-header__discord-btn',
    HEADER: 'div.game-header__content',
    HEADER_PARENT: 'header.game-header',
    OLD_CHAT_BUTTON: 'div.footer__col--chat',
    CHAT_CLOSER: 'button.chat-window__close',
    CHAT_HEADER: 'div.chat-window__header',
    CHAT_OPENED: 'tpi-chat-opened',
    CHAT_MESSAGES: 'div#chat-messages',
    ATTRACTIONS_HYPE: 'span.attraction-card__hype',
    ATTRACTIONS_HYPE_DOTS: 'span.attraction-card__hype-dot',
} as const;

/**
 * IDs used in the application.
 */
export const IDS = {
    HEADERS_WIDGETS: 'tpi-header-widgets',
    CHAT_BUTTON: 'tpi-chat-button',
    CHAT_OVERLAY: 'tpi-chat-overlay',
    TOOLBOX_BUTTON: 'tpi-toolbox-button',
    SETTINGS_MODAL: 'tpi-settings-modal',
} as const;

/**
 * Event names used in the application.
 */
export const EVENTS = {
    CHAT_TOGGLED: 'tpitoolbox:chat:toggled',
    TOOLBOX_TOGGLED: 'tpitoolbox:toolbox:toggled',
} as const;

/**
 * Strings used in the application.
 */
export const STRINGS = {
    OPEN_CHAT_BUTTON: 'Ouvrir le Chat',
    CLOSE_CHAT_BUTTON: 'Fermer le Chat',
    SAVE_SETTINGS_BUTTON: 'Sauvegarder & Recharger',
} as const;

/**
 * Configuration constants for the application.
 */
export const CONFIG = {
    // Constants about the application
    APP_NAME: 'TPI Toolbox',
    APP_VERSION: '0.1.0',
    DEVELOPER_NAME: 'Yarkis01',
    DEVELOPER_WEBSITE: 'https://github.com/Yarkis01',

    CHAT_IFRAME_SRC: 'https://www.themeparkindustries.com/tpiv4/game/chat.php',
    CHAT_IFRAME_WIDTH: 400,
} as const;
