import { BaseModule } from "../../core/abstract/BaseModule";
import { SELECTORS } from "./constants";
import { Dock } from "./components/Dock";
import { WindowManager } from "./components/WindowManager";
import { WindowComponent } from "./components/Window";
import { SettingsApp } from "./apps/SettingsApp";
import { ModuleManager } from "../../core/managers/ModuleManager";
import { createElement } from "../../utils/DomUtils";

export class OperatingSystemModule extends BaseModule {
    private dock: Dock | null = null;
    private windowManager: WindowManager | null = null;
    private moduleManager: ModuleManager;
    private activeWindows: Map<string, WindowComponent> = new Map();

    constructor(moduleManager: ModuleManager) {
        super();
        this.moduleManager = moduleManager;
    }

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'operating_system';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Système d\'exploitation';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Transforme l'interface graphique en un système d'exploitation.";
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!window.location.href.includes("game"))
            return;

        this._logger.info("Enabling OS Mode...");

        const leftMenu = document.querySelector(SELECTORS.LEFT_MENU);
        if (leftMenu)
            (leftMenu as HTMLElement).style.display = 'none';

        const gameContainer = document.querySelector(SELECTORS.GAME_CONTAINER);
        if (gameContainer)
            (gameContainer as HTMLElement).style.display = 'none';

        this.applyDesktopStyles();

        const desktopContainer = createElement('div', {
            id: 'os-desktop',
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: '100'
            }
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
                win.unminimize();
                win.focus();
                this.dock.setActive(appId);
                return;
            }
        }

        let win: WindowComponent;

        const onClose = () => {
            this.activeWindows.delete(appId);
            this.dock?.setAppOpen(appId, false);
        };

        const onFocus = () => {
            this.dock?.setActive(appId);
        };

        switch (appId) {
            case 'tools':
                win = this.windowManager.openWindow({
                    title: 'Paramètres',
                    content: new SettingsApp(this.moduleManager).render(),
                    width: 400,
                    height: 500,
                    onClose,
                    onFocus
                });
                break;
            case 'chat':
                win = this.windowManager.openWindow({
                    title: 'Chat TPI',
                    content: createElement('iframe', {
                        src: 'https://www.themeparkindustries.com/tpiv4/game/chat.php',
                        style: {
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            backgroundColor: '#202020'
                        }
                    }),
                    width: 800,
                    height: 600,
                    onClose,
                    onFocus
                });
                break;
            default:
                win = this.windowManager.openWindow({
                    title: `Application: ${appId}`,
                    content: createElement('div', { style: { padding: '20px' } }, [`Contenu pour ${appId} (Placeholder)`]),
                    width: 500,
                    height: 300,
                    onClose,
                    onFocus
                });
                break;
        }

        this.activeWindows.set(appId, win);
        this.dock.setAppOpen(appId, true);
        this.dock.setActive(appId);
    }

    /**
     * Applies desktop styles to the page.
     */
    private applyDesktopStyles(): void {
        document.body.style.backgroundColor = "#0f1110";
        document.body.style.backgroundImage = "linear-gradient(135deg, #050505 0%, #061f10 100%)"; // Black / Dark Green
        document.body.style.backgroundSize = "cover";
        document.body.style.height = "100vh";
        document.body.style.overflow = "hidden";
    }
}