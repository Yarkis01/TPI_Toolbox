import { injectStyle } from '../utils/DomUtils';
import { Logger } from '../utils/Logger';
import IApp from './interfaces/IApp';
import { ModuleManager } from './managers/ModuleManager';
import { SettingsManager } from './managers/SettingsManager';
import { registerCommonModules } from './ModuleRegistry';

/**
 * Iframe application class.
 */
export class IframeApp implements IApp {
    private readonly _logger: Logger;

    /**
     * IframeApp constructor.
     */
    public constructor() {
        this._logger = new Logger('IframeApp');
    }

    /**
     * @inheritdoc
     */
    public async start(): Promise<void> {
        this._logger.info(`🔧 IframeApp Starting on: ${window.location.href}`);

        const settingsManager = new SettingsManager();

        if (settingsManager.getModuleState("operating_system", false)) {
            this._logger.info('🔧 Operating System Module is enabled. Enabling...');
            const moduleManager = new ModuleManager(settingsManager);
            this._initializeModules(moduleManager);
        }

        this._logger.info('🧼 Applying Chat Cleaner in iframe context...');

        if (window.location.href.endsWith('chat.php')) {
            injectStyle(`
                button.chat-window__close {
                    display: none !important;
                    visibility: hidden !important;
                }

                div.chat-window__header {
                    flex-direction: column !important;
                    height: auto !important;
                }

                div#chat-messages {
                    max-height: none !important;
                }
            `);
        }

        this._monitorAdvanceDayButton();
    }

    /**
     * Monitors the advance day button for clicks.
     */
    private _monitorAdvanceDayButton(): void {
        if (!window.location.href.includes('new_day.php')) {
            return;
        }

        const setupButtonListener = () => {
            const button = document.getElementById('new-day-advance-btn');
            if (button) {
                button.addEventListener('click', () => {
                    const checkInterval = setInterval(() => {
                        const loader = document.getElementById('simulation-loader');
                        if (!loader || loader.style.display === 'none') {
                            clearInterval(checkInterval);
                            window.parent.postMessage({ type: 'TPI_TOOLBOX_REFRESH_OTHERS' }, '*');
                        }
                    }, 100);

                    setTimeout(() => clearInterval(checkInterval), 10000);
                });
            } else {
                setTimeout(setupButtonListener, 500);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupButtonListener);
        } else {
            setupButtonListener();
        }
    }

    /**
     * Initializes application modules.
     * @param moduleManager The module manager instance.
     */
    private _initializeModules(moduleManager: ModuleManager): void {
        this._logger.info('📦 Initializing modules in Iframe...');

        registerCommonModules(moduleManager);

        this._logger.info('✅ Modules initialized in Iframe.');
    }
}
