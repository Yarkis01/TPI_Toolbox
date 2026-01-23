import { BaseModule } from '../../core/abstract/BaseModule';
import { ModuleManager } from '../../core/managers/ModuleManager';
import { createElement } from '../../utils/DomUtils';
import { SettingsApp } from './apps/SettingsApp';
import { IFrameApp } from './apps/IFrameApp';
import { Dock } from './components/Dock';
import { WindowComponent } from './components/Window';
import { WindowManager } from './components/WindowManager';
import { APP_IDS, OS_CONFIG, SELECTORS } from './constants';

/**
 * Represents the operating system module.
 */
export class OperatingSystemModule extends BaseModule {
    private dock: Dock | null = null;
    private windowManager: WindowManager | null = null;
    private moduleManager: ModuleManager;
    private activeWindows: Map<string, WindowComponent> = new Map();

    /**
     * Creates a new instance of the OperatingSystemModule.
     * @param moduleManager - The module manager.
     */
    public constructor(moduleManager: ModuleManager) {
        super();
        this.moduleManager = moduleManager;
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
        if (!window.location.href.includes('game')) return;

        this._logger.info('Enabling OS Mode...');

        const leftMenu = document.querySelector(SELECTORS.LEFT_MENU);
        if (leftMenu) (leftMenu as HTMLElement).style.display = 'none';

        const gameContainer = document.querySelector(SELECTORS.GAME_CONTAINER);
        if (gameContainer) (gameContainer as HTMLElement).style.display = 'none';

        this.applyDesktopStyles();

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
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
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
        };

        const onFocus = () => {
            this.dock?.setActive(appId);
        };

        const getAppConfig = () => {
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
                default:
                    return {
                        title: `Application: ${appId}`,
                        content: createElement('div', { style: { padding: '20px' } }, [`Contenu pour ${appId} (Placeholder)`]),
                    };
            }
        };

        const { title, content } = getAppConfig();

        win = this.windowManager.openWindow({
            title,
            content,
            width: 800,
            height: 600,
            onClose,
            onFocus,
        });

        this.activeWindows.set(appId, win);
        this.dock.setAppOpen(appId, true);
        this.dock.setActive(appId);
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
}
