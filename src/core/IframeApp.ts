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

            this._setupRefreshTriggers();
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
    }

    /**
     * Monitors the advance day button for clicks.
     */
    /**
     * Sets up triggers for refreshing other windows.
     */
    private _setupRefreshTriggers(): void {
        interface TriggerConfig {
            urlPart?: string;
            selector: string;
            handler: (element: HTMLElement) => void;
        }

        const triggers: TriggerConfig[] = [
            // New Day Advance Button
            {
                urlPart: 'new_day.php',
                selector: '#new-day-advance-btn',
                handler: (btn) => {
                    btn.addEventListener('click', () => {
                        window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_START' }, '*');

                        // Poll until loader is hidden (request completed)
                        const checkInterval = setInterval(() => {
                            const loader = document.getElementById('simulation-loader');
                            if (!loader || loader.style.display === 'none') {
                                clearInterval(checkInterval);

                                window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_END' }, '*');
                                window.parent.postMessage({ type: 'TPI_TOOLBOX_REFRESH_OTHERS' }, '*');
                            }
                        }, 100);

                        // Fallback timeout after 10 seconds
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_END' }, '*');
                        }, 10000);
                    });
                }
            },
            // Transfer Confirm Button
            {
                selector: '#transfer-confirm-btn',
                handler: (btn) => {
                    btn.addEventListener('click', () => {
                        this._logger.info('🖱️ Transfer button clicked. Monitoring for success (reload)...');
                        window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_START' }, '*');

                        let isComplete = false;

                        const onUnload = () => {
                            if (!isComplete) {
                                isComplete = true;
                                this._logger.info('✅ Page unloading (Transfer success). Requesting refresh of other windows.');
                                window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_END' }, '*');
                                window.parent.postMessage({ type: 'TPI_TOOLBOX_REFRESH_OTHERS' }, '*');
                            }
                        };

                        window.addEventListener('beforeunload', onUnload);

                        const checkErrorInterval = setInterval(() => {
                            if (isComplete) {
                                clearInterval(checkErrorInterval);
                                return;
                            }

                            if (!(btn as HTMLButtonElement).disabled) {
                                isComplete = true;
                                clearInterval(checkErrorInterval);
                                window.removeEventListener('beforeunload', onUnload);
                                window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_END' }, '*');
                                this._logger.warn('❌ Transfer button re-enabled without unload. Assuming error.');
                            }
                        }, 200);

                        setTimeout(() => {
                            if (!isComplete) {
                                isComplete = true;
                                clearInterval(checkErrorInterval);
                                window.removeEventListener('beforeunload', onUnload);
                                window.parent.postMessage({ type: 'TPI_TOOLBOX_LOADING_END' }, '*');
                                this._logger.warn('⚠️ Transfer monitoring timed out.');
                            }
                        }, 10000);
                    });
                }
            }
        ];

        const tryAttachListener = (config: TriggerConfig) => {
            if (config.urlPart && !window.location.href.includes(config.urlPart)) {
                return;
            }

            const element = document.querySelector(config.selector);
            if (element && element instanceof HTMLElement) {
                this._logger.info(`✅ Found trigger element: ${config.selector}`);
                config.handler(element);
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
     * Initializes application modules.
     * @param moduleManager The module manager instance.
     */
    private _initializeModules(moduleManager: ModuleManager): void {
        this._logger.info('📦 Initializing modules in Iframe...');

        registerCommonModules(moduleManager);

        this._logger.info('✅ Modules initialized in Iframe.');
    }
}
