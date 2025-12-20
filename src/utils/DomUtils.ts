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

/**
 * Creates an HTML element with specified attributes and children.
 * @param tag - The HTML tag name.
 * @param attributes - The attributes to set on the element.
 * @param children - The child elements or text nodes to append.
 * @returns The created HTML element.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes: Record<string, string | Function | Object> = {},
    children: (HTMLElement | string | SVGElement)[] = []
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.substring(2).toLowerCase();
            element.addEventListener(eventName, value as EventListener);
        } else {
            element.setAttribute(key, String(value));
        }
    });

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}