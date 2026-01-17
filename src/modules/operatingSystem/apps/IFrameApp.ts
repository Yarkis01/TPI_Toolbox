import { createElement, injectStyle } from "../../../utils/DomUtils";

/**
 * Options for the IFrameApp.
 */
export interface IFrameAppOptions {
    removeSelectors?: string[];
    customStyles?: Partial<CSSStyleDeclaration>;
    backgroundColor?: string;
}

/**
 * Represents an iframe application.
 */
export class IFrameApp {
    private url: string;
    private options: IFrameAppOptions;

    /**
     * Creates a new instance of the IFrameApp.
     * @param url - The URL of the iframe.
     * @param options - The options for the iframe.
     */
    public constructor(url: string, options: IFrameAppOptions = {}) {
        this.url = url;
        this.options = {
            removeSelectors: ['#left-menu', 'div.dashboard-welcome'],
            backgroundColor: '#202020',
            ...options
        };
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
                ...(this.options.customStyles || {})
            }
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

            if (this.options.removeSelectors && this.options.removeSelectors.length > 0) {
                const styleContent = `
                    ${this.options.removeSelectors.join(', ')} { display: none !important; }
                    body .play-main, body.dashboard-page .play-main, body.monbureau-page .play-main {
                        margin-left: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding-left: 0 !important;
                    }

                    @media (max-width: 1289px) {
                        body.dashboard-page .play-main { margin-left: 0 !important; width: 100% !important; }
                    }
                `;
                injectStyle(styleContent, doc);
            }
        } catch (e) {
            console.warn(`[IFrameApp] Cannot modify iframe content for ${this.url}. Possible CORS restriction.`);
        }
    }
}

