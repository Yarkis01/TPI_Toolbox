import { ChatModifier } from "../ui/modifiers/ChatModifier";
import { Logger } from "../utils/Logger";

/**
 * Application class for iframe contexts.
 */
export class IframeApp {
    private readonly _logger: Logger;

    /**
     * Creates an instance of the IframeApp class.
     */
    public constructor() {
        this._logger = new Logger("IframeApp");
    }

    /**
     * Initializes the iframe application.
     */
    public async initialize(): Promise<void> {
        this._logger.info("🚀 IframeApp is initializing...");

        this._applyChatCleaner()
    };

    /**
     * Applies the chat cleaner modifier.
     */
    private _applyChatCleaner(): void {
        this._logger.info("🧼 Applying Chat Cleaner in iframe context...")
        
        if(window.location.href.endsWith("chat.php")) {
            const chatModifier = new ChatModifier();
            chatModifier.apply();
        }
    }
}