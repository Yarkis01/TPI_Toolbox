import { BaseModule } from '../../core/abstract/BaseModule';
import { ModuleManager } from '../../core/managers/ModuleManager';
import { StorageService } from '../../services/StorageService';
import { createElement } from '../../utils/DomUtils';
import { SettingsApp } from './apps/SettingsApp';
import { IFrameApp } from './apps/IFrameApp';
import { Dock } from './components/Dock';
import { WindowComponent } from './components/Window';
import { WindowManager } from './components/WindowManager';
import { APP_IDS, OS_CONFIG, SavedWindowState, SELECTORS, SessionState, SETTINGS_KEYS } from './constants';

/**
 * Represents the operating system module.
 */
export class OperatingSystemModule extends BaseModule {
    private dock: Dock | null = null;
    private windowManager: WindowManager | null = null;
    private moduleManager: ModuleManager;
    private activeWindows: Map<string, WindowComponent> = new Map();
    private _messageHandler: (event: MessageEvent) => void;
    private storageService: StorageService;

    /**
     * Creates a new instance of the OperatingSystemModule.
     * @param moduleManager - The module manager.
     */
    public constructor(moduleManager: ModuleManager) {
        super();
        this.moduleManager = moduleManager;
        this.storageService = new StorageService();
        this._messageHandler = this.handleMessage.bind(this);
    }

    /**
     * @inheritdoc
     */
    public get id(): string {
        return OS_CONFIG.ID;
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return OS_CONFIG.NAME;
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return OS_CONFIG.DESCRIPTION;
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        const isIframe = window.self !== window.top;

        if (isIframe) {
            this._setupIframeTriggers();
            return;
        }

        if (!window.location.href.includes('game')) return;

        this._logger.info('Enabling OS Mode...');

        window.addEventListener('message', this._messageHandler);

        const leftMenu = document.querySelector(SELECTORS.LEFT_MENU);
        if (leftMenu) (leftMenu as HTMLElement).style.display = 'none';

        const gameContainer = document.querySelector(SELECTORS.GAME_CONTAINER);
        if (gameContainer) (gameContainer as HTMLElement).style.display = 'none';

        this.applyDesktopStyles();
        this.applyReducedEffectsFromStorage();

        const desktopContainer = createElement('div', {
            id: SELECTORS.DESKTOP_CONTAINER,
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: '100',
            },
        });
        document.body.appendChild(desktopContainer);

        this.windowManager = new WindowManager(desktopContainer);

        this.dock = new Dock((itemId) => this.handleAppLaunch(itemId));
        this.dock.mount(document.body);

        this.restoreSession();
    }

    /**
     * Applies reduced visual effects setting from storage.
     */
    private applyReducedEffectsFromStorage(): void {
        const reduceEffects = this.storageService.load<boolean>(SETTINGS_KEYS.REDUCE_EFFECTS, false);
        if (reduceEffects) {
            document.body.classList.add('os-reduce-effects');
            this._logger.info('Reduced visual effects enabled.');
        }
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        window.removeEventListener('message', this._messageHandler);
        window.location.reload();
    }

    /**
     * Handles the launch of an application.
     * @param appId - The ID of the application to launch.
     */
    private handleAppLaunch(appId: string): void {
        if (!this.windowManager || !this.dock) return;

        if (this.activeWindows.has(appId)) {
            const win = this.activeWindows.get(appId);
            if (win) {
                win.focus();
                this.dock.setActive(appId);
                return;
            }
        }

        let win: WindowComponent;

        const onClose = () => {
            this.activeWindows.delete(appId);
            this.dock?.setAppOpen(appId, false);
            this.dock?.removeActive(appId);
            this.saveSession();
        };

        const onFocus = () => {
            this.dock?.setActive(appId);
            this.saveSession();
        };

        const onMoveOrResize = () => {
            this.saveSession();
        };

        let appConfig = this.getAppConfig(appId);
        if (!appConfig) {
            appConfig = {
                title: `Application: ${appId}`,
                content: createElement('div', { style: { padding: '20px' } }, [`Contenu pour ${appId} (Placeholder)`]),
            };
        }

        win = this.windowManager.openWindow({
            title: appConfig.title,
            content: appConfig.content,
            width: 800,
            height: 600,
            onClose,
            onFocus,
            onMoveOrResize,
        });

        this.activeWindows.set(appId, win);
        this.dock.setAppOpen(appId, true);
        this.dock.setActive(appId);
        this.saveSession();
    }

    /**
     * Handles messages received from iframes.
     * @param event - The message event.
     */
    private handleMessage(event: MessageEvent): void {
        if (event.data?.type === 'TPI_TOOLBOX_LOADING_START') {
            this._logger.info('Received loading start signal.');
            this.setLoadingOnOtherWindows(event.source as Window, true);
        } else if (event.data?.type === 'TPI_TOOLBOX_LOADING_END') {
            this._logger.info('Received loading end signal.');
            this.setLoadingOnOtherWindows(event.source as Window, false);
        } else if (event.data?.type === 'TPI_TOOLBOX_REFRESH_OTHERS') {
            this._logger.info('Received request to refresh other windows via MessageEvent.');
            this.refreshOtherWindows(event.source as Window);
        }
    }

    /**
     * Shows or hides loading overlay on all windows except the source.
     * @param sourceWindow - The window that initiated the request.
     * @param isLoading - Whether to show or hide the loading overlay.
     */
    private setLoadingOnOtherWindows(sourceWindow: Window, isLoading: boolean): void {
        this.activeWindows.forEach((winComponent: WindowComponent, appId: string) => {
            const iframe = winComponent.element.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                if (iframe.contentWindow !== sourceWindow) {
                    const content = winComponent.element.querySelector('.window-content');
                    if (content) {
                        let loader = content.querySelector('.window-loading-overlay') as HTMLElement;

                        if (isLoading) {
                            if (!loader) {
                                loader = document.createElement('div');
                                loader.className = 'window-loading-overlay';
                                loader.innerHTML = `
                                    <div class="loading-spinner"></div>
                                    <span>Chargement en cours...</span>
                                `;
                                content.appendChild(loader);
                            }
                            loader.classList.add('active');
                            this._logger.info(`Showing loader on window: ${appId}`);
                        } else if (loader) {
                            loader.classList.remove('active');
                            this._logger.info(`Hiding loader on window: ${appId}`);
                        }
                    }
                }
            }
        });
    }

    /**
     * Refreshes all open windows except the one that initiated the request.
     * @param sourceWindow - The window that initiated the request.
     */
    private refreshOtherWindows(sourceWindow: Window): void {
        this.activeWindows.forEach((winComponent: WindowComponent, appId: string) => {
            const iframe = winComponent.element.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                if (iframe.contentWindow !== sourceWindow) {
                    this._logger.info(`Refreshing window: ${appId}`);
                    try {
                        iframe.contentWindow.location.reload();
                    } catch (error) {
                        this._logger.error(`Failed to refresh window ${appId}: ${(error as Error).message}`);
                    }
                }
            }
        });
    }

    /**
     * Applies desktop styles to the page.
     */
    private applyDesktopStyles(): void {
        document.body.style.backgroundColor = OS_CONFIG.STYLES.DESKTOP_BG_COLOR;
        document.body.style.backgroundImage = OS_CONFIG.STYLES.DESKTOP_BG;
        document.body.style.backgroundSize = 'cover';
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Saves the current session state to storage.
     */
    private saveSession(): void {
        const restoreEnabled = this.storageService.load<boolean>(SETTINGS_KEYS.RESTORE_SESSION, true);
        if (!restoreEnabled) return;

        const windows: SavedWindowState[] = [];
        let focusedAppId: string | null = null;

        this.activeWindows.forEach((win, appId) => {
            const state = win.getWindowState();
            windows.push({
                appId,
                x: state.x,
                y: state.y,
                width: state.width,
                height: state.height,
                zIndex: state.zIndex,
                isMaximized: state.isMaximized,
            });

            if (win.element.classList.contains('active-window')) {
                focusedAppId = appId;
            }
        });

        const session: SessionState = { windows, focusedAppId };
        this.storageService.save(SETTINGS_KEYS.SESSION_STATE, session);
        this._logger.info(`Session saved: ${windows.length} window(s)`);
    }

    /**
     * Restores the session state from storage.
     */
    private restoreSession(): void {
        const restoreEnabled = this.storageService.load<boolean>(SETTINGS_KEYS.RESTORE_SESSION, true);
        if (!restoreEnabled) {
            this._logger.info('Session restore is disabled.');
            return;
        }

        const session = this.storageService.load<SessionState | null>(SETTINGS_KEYS.SESSION_STATE, null);
        if (!session || !session.windows || session.windows.length === 0) {
            this._logger.info('No session to restore.');
            return;
        }

        this._logger.info(`Restoring session: ${session.windows.length} window(s)`);

        const sortedWindows = [...session.windows].sort((a, b) => a.zIndex - b.zIndex);

        sortedWindows.forEach((savedState) => {
            this.openWindowWithState(savedState);
        });

        if (session.focusedAppId && this.activeWindows.has(session.focusedAppId)) {
            const focusedWin = this.activeWindows.get(session.focusedAppId);
            if (focusedWin) {
                focusedWin.focus();
            }
        }
    }

    /**
     * Opens a window with a saved state.
     * @param savedState - The saved window state.
     */
    private openWindowWithState(savedState: SavedWindowState): void {
        if (!this.windowManager || !this.dock) return;

        if (this.activeWindows.has(savedState.appId)) return;

        const onClose = () => {
            this.activeWindows.delete(savedState.appId);
            this.dock?.setAppOpen(savedState.appId, false);
            this.dock?.removeActive(savedState.appId);
            this.saveSession();
        };

        const onFocus = () => {
            this.dock?.setActive(savedState.appId);
            this.saveSession();
        };

        const onMoveOrResize = () => {
            this.saveSession();
        };

        const appConfig = this.getAppConfig(savedState.appId);
        if (!appConfig) return;

        const win = this.windowManager.openWindow({
            title: appConfig.title,
            content: appConfig.content,
            width: savedState.width,
            height: savedState.height,
            x: savedState.x,
            y: savedState.y,
            onClose,
            onFocus,
            onMoveOrResize,
        });

        win.applyState({
            x: savedState.x,
            y: savedState.y,
            width: savedState.width,
            height: savedState.height,
            isMaximized: savedState.isMaximized,
        });

        this.activeWindows.set(savedState.appId, win);
        this.dock.setAppOpen(savedState.appId, true);
    }

    /**
     * Gets the app configuration for a given app ID.
     * @param appId - The app ID.
     * @returns The app configuration or null if not found.
     */
    private getAppConfig(appId: string): { title: string; content: HTMLElement } | null {
        switch (appId) {
            case APP_IDS.TOOLS:
                return {
                    title: OS_CONFIG.DOCK.LABELS.TOOLS,
                    content: new SettingsApp(this.moduleManager).render(),
                };
            case APP_IDS.BROWSER:
                return {
                    title: OS_CONFIG.DOCK.LABELS.BROWSER,
                    content: new IFrameApp(OS_CONFIG.URL_BROWSER).render(),
                };
            case APP_IDS.CHAT:
                return {
                    title: OS_CONFIG.DOCK.LABELS.CHAT,
                    content: new IFrameApp(OS_CONFIG.URL_CHAT, {
                        backgroundColor: OS_CONFIG.STYLES.CHAT_BG,
                    }).render(),
                };
            case APP_IDS.PROFILE:
                return {
                    title: OS_CONFIG.DOCK.LABELS.PROFILE,
                    content: new IFrameApp(OS_CONFIG.URL_PROFILE, {
                        removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
                        forceFullWidth: true,
                    }).render(),
                };
            case APP_IDS.MAIL:
                return {
                    title: OS_CONFIG.DOCK.LABELS.MAIL,
                    content: new IFrameApp(OS_CONFIG.URL_MAIL, {
                        removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
                        forceFullWidth: true,
                    }).render(),
                };
            case APP_IDS.INVEST:
                return {
                    title: OS_CONFIG.DOCK.LABELS.INVEST,
                    content: new IFrameApp(OS_CONFIG.URL_INVEST, {
                        removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
                        forceFullWidth: true,
                    }).render(),
                };
            case APP_IDS.SHOP:
                return {
                    title: OS_CONFIG.DOCK.LABELS.SHOP,
                    content: new IFrameApp(OS_CONFIG.URL_SHOP, {
                        removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
                        forceFullWidth: true,
                    }).render(),
                };
            case APP_IDS.MY_PARK:
                return {
                    title: OS_CONFIG.DOCK.LABELS.MY_PARK,
                    content: new IFrameApp(OS_CONFIG.URL_MY_PARK, {
                        removeSelectors: ["a.left-menu__item:nth-child(1)", "a.left-menu__item:nth-child(2)", "div.left-menu__separator", "div.dashboard-welcome", "div.left-menu__footer"],
                        forceFullWidth: false,
                    }).render(),
                };
            case APP_IDS.NEXT_DAY:
                return {
                    title: OS_CONFIG.DOCK.LABELS.NEXT_DAY,
                    content: new IFrameApp(OS_CONFIG.URL_NEXT_DAY, {
                        removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
                        forceFullWidth: true,
                    }).render(),
                };
            case APP_IDS.RANKING:
                return {
                    title: OS_CONFIG.DOCK.LABELS.RANKING,
                    content: new IFrameApp(OS_CONFIG.URL_RANKING, {
                        removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
                        forceFullWidth: true,
                    }).render(),
                };
            default:
                return null;
        }
    }

    /**
     * Sets up event listeners for iframe triggers.
     */
    private _setupIframeTriggers(): void {
        interface TriggerConfig {
            selector: string;
            urlPart?: string;
            strategy: 'element-hide' | 'unload-or-reenable';
            targetSelector?: string;
        }

        const triggers: TriggerConfig[] = [
            {
                urlPart: 'new_day.php',
                selector: '#new-day-advance-btn',
                strategy: 'element-hide',
                targetSelector: '#simulation-loader'
            },
            {
                selector: '#transfer-confirm-btn',
                strategy: 'unload-or-reenable'
            }
        ];

        const tryAttachListener = (config: TriggerConfig) => {
            if (config.urlPart && !window.location.href.includes(config.urlPart)) return;

            const element = document.querySelector(config.selector);
            if (element && element instanceof HTMLElement) {
                this._logger.info(`✅ Found trigger element: ${config.selector}`);
                element.addEventListener('click', () => {
                    this.monitorAsyncAction(config.strategy, element as HTMLButtonElement, config.targetSelector);
                });
            } else {
                setTimeout(() => tryAttachListener(config), 1000);
            }
        };

        triggers.forEach(config => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => tryAttachListener(config));
            } else {
                tryAttachListener(config);
            }
        });
    }

    /**
     * Monitors an async action (like a button click) and signals loading states.
     * @param strategy - The strategy to detect completion.
     * @param button - The button that was clicked.
     * @param targetSelector - (Optional) Selector to watch for hiding (for 'element-hide').
     */
    private monitorAsyncAction(
        strategy: 'element-hide' | 'unload-or-reenable',
        button: HTMLButtonElement,
        targetSelector?: string
    ): void {
        window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_START' }, '*');
        this._logger.info(`Starting async monitoring: ${strategy}`);

        let isFinalized = false;
        let cleanup: () => void = () => { };

        const finalize = (success: boolean) => {
            if (isFinalized) return;
            isFinalized = true;
            cleanup();

            window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_END' }, '*');
            if (success) {
                window.parent.postMessage({ type: 'TPI_TOOLBOX_REFRESH_OTHERS' }, '*');
                this._logger.info('✅ Action completed successfully.');
            } else {
                this._logger.warn('⚠️ Action failed or timed out.');
            }
        };

        const timeoutId = setTimeout(() => finalize(false), 10000);

        if (strategy === 'element-hide' && targetSelector) {
            const interval = setInterval(() => {
                const target = document.querySelector(targetSelector) as HTMLElement;
                if (!target || target.style.display === 'none') {
                    finalize(true);
                }
            }, 100);
            cleanup = () => { clearInterval(interval); clearTimeout(timeoutId); };
        }
        else if (strategy === 'unload-or-reenable') {
            const onUnload = () => finalize(true);
            window.addEventListener('beforeunload', onUnload);

            const interval = setInterval(() => {
                if (!button.disabled) {
                    finalize(false);
                }
            }, 200);

            cleanup = () => {
                clearInterval(interval);
                clearTimeout(timeoutId);
                window.removeEventListener('beforeunload', onUnload);
            };
        }
    }
}
