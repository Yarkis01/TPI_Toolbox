import { Logger } from './utils/Logger';

(async () => {
    const logger = new Logger('TPI_Toolbox');

    if (window.top === window.self) {
        logger.info('🚀 TPI Toolbox is starting...');

        try {
            const { App } = await import('./core/App');
            const app = new App();
            await app.initialize();
        } catch (error) {
            logger.error(`Failed to start TPI Toolbox: ${(error as Error).message}`);
        }
    } else {
        logger.warn('⚠️ Detected iframe context, initializing IframeApp...');

        const { IframeApp } = await import('./core/IframeApp');
        const iframeApp = new IframeApp();
        await iframeApp.initialize();
    }
})();
