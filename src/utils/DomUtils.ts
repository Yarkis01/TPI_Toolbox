/**
 * Injects CSS styles into the document.
 * @param style - The CSS styles to inject.
 */
export function injectStyle(style: string): void {
    if (typeof GM_addStyle === 'function') {
        GM_addStyle(style);
    } else {
        const styleElement = document.createElement('style');

        styleElement.textContent = style;
        styleElement.id = 'tpi-toolbox-styles';

        (document.head || document.body).appendChild(styleElement);
    }
}