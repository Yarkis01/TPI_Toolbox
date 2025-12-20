import { Logger } from "./utils/Logger";

(async () => {
    const logger = new Logger("TPI_Toolbox");

    logger.info("🚀 TPI Toolbox is starting...");

    try {
        const { App } = await import("./core/App");
        const app = new App();
        await app.initialize();
    } catch (error) {
        logger.error(`Failed to start TPI Toolbox: ${(error as Error).message}`);
    }
})();