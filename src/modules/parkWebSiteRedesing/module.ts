import { BaseModule } from '../../core/abstract/BaseModule';
import {
    DATA_ATTRIBUTES,
    ELEMENT_IDS,
    PARK_SELECTORS,
    STORAGE_KEYS,
    THEME_ICONS,
} from './constants';
import { STYLES } from './styles';

/**
 * Module that redesigns the park website with a modern, ergonomic look
 */
export class ParkWebSiteRedesingModule extends BaseModule {
    private _styleElement: HTMLStyleElement | null = null;
    private _toggleButton: HTMLButtonElement | null = null;

    /**
     * @inheritdoc
     */
    public get id() {
        return 'park_website_redesing';
    }

    /**
     * @inheritdoc
     */
    public get name() {
        return 'Redesign de la page web d\'un park';
    }

    /**
     * @inheritdoc
     */
    public get description() {
        return 'Applique un design moderne et ergonomique avec support du thème clair/sombre.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        // Only enable if we're on a park website page
        if (!document.querySelector(PARK_SELECTORS.WEBSITE_CONTAINER)) {
            this._logger.debug('Module ignored: park website container not found.');
            return;
        }

        this._injectStyles();
        this._injectToggleButton();
        this._applyTheme(this._getSavedTheme());
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._removeStyles();
        this._removeToggleButton();
        this._removeTheme();
    }

    /**
     * Injects the CSS styles into the document head.
     * Styles are marked with a data attribute for easy identification.
     */
    private _injectStyles(): void {
        if (this._styleElement) {
            return;
        }

        this._styleElement = document.createElement('style');
        this._styleElement.setAttribute(DATA_ATTRIBUTES.STYLE_MARKER, 'true');
        this._styleElement.textContent = STYLES;
        document.head.appendChild(this._styleElement);

        this._logger.debug('Styles injected successfully');
    }

    /**
     * Removes the injected styles from the document.
     */
    private _removeStyles(): void {
        if (this._styleElement && this._styleElement.parentNode) {
            this._styleElement.parentNode.removeChild(this._styleElement);
            this._styleElement = null;
            this._logger.debug('Styles removed successfully');
        }
    }

    /**
     * Injects the floating theme toggle button into the document body.
     * Button is positioned at bottom-left and includes accessibility attributes.
     */
    private _injectToggleButton(): void {
        if (this._toggleButton) {
            return;
        }

        this._toggleButton = document.createElement('button');
        this._toggleButton.id = ELEMENT_IDS.THEME_TOGGLE;
        this._toggleButton.setAttribute('aria-label', 'Changer de thème');
        this._toggleButton.innerHTML = this._getThemeIcon(this._getSavedTheme());
        this._toggleButton.addEventListener('click', () => this._toggleTheme());

        document.body.appendChild(this._toggleButton);

        this._logger.debug('Toggle button injected successfully');
    }

    /**
     * Removes the theme toggle button from the document.
     */
    private _removeToggleButton(): void {
        if (this._toggleButton && this._toggleButton.parentNode) {
            this._toggleButton.parentNode.removeChild(this._toggleButton);
            this._toggleButton = null;
            this._logger.debug('Toggle button removed successfully');
        }
    }

    /**
     * Toggles between light and dark themes.
     */
    private _toggleTheme(): void {
        const currentTheme = this._getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this._applyTheme(newTheme);
        this._saveTheme(newTheme);
    }

    /**
     * Applies the specified theme to the document.
     * Light theme: adds `data-theme="light"` attribute to document root.
     * Dark theme: removes the data-theme attribute.
     * 
     * @param theme - The theme to apply ('light' or 'dark').
     */
    private _applyTheme(theme: 'light' | 'dark'): void {
        if (theme === 'light') {
            document.documentElement.setAttribute(DATA_ATTRIBUTES.THEME, 'light');
        } else {
            document.documentElement.removeAttribute(DATA_ATTRIBUTES.THEME);
        }

        if (this._toggleButton) {
            this._toggleButton.innerHTML = this._getThemeIcon(theme);
        }

        this._logger.debug(`Theme applied: ${theme}`);
    }

    /**
     * Removes the theme attribute from the document root.
     */
    private _removeTheme(): void {
        document.documentElement.removeAttribute(DATA_ATTRIBUTES.THEME);
    }

    /**
     * Gets the currently applied theme.
     * 
     * @returns The current theme ('light' or 'dark').
     */
    private _getCurrentTheme(): 'light' | 'dark' {
        return document.documentElement.hasAttribute(DATA_ATTRIBUTES.THEME) ? 'light' : 'dark';
    }

    /**
     * Retrieves the saved theme preference from localStorage.
     * 
     * @returns The saved theme, or 'dark' as the default.
     */
    private _getSavedTheme(): 'light' | 'dark' {
        const saved = localStorage.getItem(STORAGE_KEYS.THEME);
        return saved === 'light' ? 'light' : 'dark';
    }

    /**
     * Saves the theme preference to localStorage.
     * 
     * @param theme - The theme to save.
     */
    private _saveTheme(theme: 'light' | 'dark'): void {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }

    /**
     * Gets the appropriate icon for the current theme.
     * Returns a sun icon when in dark mode (clicking will switch to light),
     * and a moon icon when in light mode (clicking will switch to dark).
     * 
     * @param theme - The current theme.
     * @returns The HTML icon string (emoji).
     */
    private _getThemeIcon(theme: 'light' | 'dark'): string {
        return theme === 'dark' ? THEME_ICONS.SUN : THEME_ICONS.MOON;
    }
}
