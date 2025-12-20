import { CONFIG, SELECTORS } from "../../core/Config";
import { injectStyle } from "../../utils/DomUtils";
import { Logger } from "../../utils/Logger";
import { IModifier } from "../interfaces/IModifier";

/**
 * Cleaner class to remove unnecessary layout elements from the UI.
 */
export class LayoutCleaner implements IModifier {
    private readonly _logger: Logger;

    /**
     * Creates an instance of LayoutCleaner.
     */
    public constructor() {
        this._logger = new Logger("LayoutCleaner");
    }
    
    /**
     * @inheritdoc
     */
    public apply(): void {
        this._logger.debug("Removing useless UI elements...");

        injectStyle(`
            ${SELECTORS.LINK_TUTORIAL}, ${SELECTORS.DISCORD_BUTTON}, ${SELECTORS.OLD_CHAT_BUTTON}, ${SELECTORS.LOGOUT_BUTTON} {
                display: none !important;
                visibility: hidden !important;
            }
        `);

        this._logger.debug("Useless UI elements removed.");
    }
}