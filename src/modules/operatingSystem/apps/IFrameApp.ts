import { createElement, injectStyle } from '../../../utils/DomUtils';
import { Logger } from '../../../utils/Logger';

/**
 * Options for the IFrameApp.
 */
export interface IFrameAppOptions {
    removeSelectors?: readonly string[];
    customStyles?: Partial<CSSStyleDeclaration>;
    backgroundColor?: string;
    forceFullWidth?: boolean;
}

/**
 * Represents an iframe application.
 */
export class IFrameApp {
    private url: string;
    private options: IFrameAppOptions;
    private logger: Logger;

    /**
     * Creates a new instance of the IFrameApp.
     * @param url - The URL of the iframe.
     * @param options - The options for the iframe.
     */
    public constructor(url: string, options: IFrameAppOptions = {}) {
        this.url = url;
        this.options = options;
        this.logger = new Logger('OS - IFrameApp');
    }

    /**
     * Renders the iframe application.
     * @returns The iframe element.
     */
    public render(): HTMLElement {
        const iframe = createElement('iframe', {
            src: this.url,
            style: {
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: this.options.backgroundColor || '#202020',
                ...(this.options.customStyles || {}),
            },
        }) as HTMLIFrameElement;

        iframe.addEventListener('load', () => this.injectCleanup(iframe));

        return iframe;
    }

    /**
     * Injects cleanup styles into the iframe.
     * @param iframe - The iframe element.
     */
    private injectCleanup(iframe: HTMLIFrameElement): void {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;

            let styleContent = '';

            if (this.options.removeSelectors && this.options.removeSelectors.length > 0) {
                styleContent += `${this.options.removeSelectors.join(', ')} { display: none !important; }`;
            }

            if (this.options.forceFullWidth) {
                styleContent += `body { --sidebar-w: 0px !important; --app-mobile-header-h: 0px !important; }`;
            }

            if (styleContent) {
                injectStyle(styleContent, doc);
            }
        } catch (e) {
            this.logger.error(
                `Cannot modify iframe content for ${this.url}. Possible CORS restriction.`,
            );
        }
    }
}
