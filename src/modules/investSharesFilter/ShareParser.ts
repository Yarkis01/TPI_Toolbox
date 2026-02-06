import { SELECTORS } from './constants';
import { IShare, IShareParser } from './types';

/**
 * Parses share data from DOM elements.
 */
export class ShareParser implements IShareParser {
    /**
     * Parses all shares from the DOM.
     * @returns Array of parsed shares.
     */
    public parseAll(): IShare[] {
        const elements = document.querySelectorAll<HTMLElement>(SELECTORS.SHARE_ITEM);
        const shares: IShare[] = [];

        elements.forEach((element) => {
            const share = this.parse(element);
            if (share) {
                shares.push(share);
            }
        });

        return shares;
    }

    /**
     * Parses a single share element.
     * @param element The share DOM element.
     * @returns The parsed share or null if invalid.
     */
    public parse(element: HTMLElement): IShare | null {
        const id = element.dataset.partId;
        if (!id) return null;

        const tag = this._extractTag(element);
        const holdingName = this._extractHoldingName(element);
        const { percentage, isPositive } = this._extractIndex(element);
        const price = this._extractPrice(element);

        return {
            id,
            tag,
            holdingName,
            indexPercentage: percentage,
            isIndexPositive: isPositive,
            price,
            element,
        };
    }

    /**
     * Extracts the holding tag from an element.
     * @param element The share element.
     * @returns The tag string.
     */
    private _extractTag(element: HTMLElement): string {
        const tagEl = element.querySelector(SELECTORS.HOLDING_TAG);
        return tagEl?.textContent?.trim() || '';
    }

    /**
     * Extracts the holding name from an element.
     * @param element The share element.
     * @returns The holding name.
     */
    private _extractHoldingName(element: HTMLElement): string {
        const nameEl = element.querySelector(SELECTORS.HOLDING_NAME);
        return nameEl?.textContent?.trim() || '';
    }

    /**
     * Extracts the index percentage from an element.
     * @param element The share element.
     * @returns Object with percentage and positivity flag.
     */
    private _extractIndex(element: HTMLElement): { percentage: number; isPositive: boolean } {
        const indexEl = element.querySelector(SELECTORS.INDEX_VALUE);
        const text = indexEl?.textContent?.trim() || '0%';

        // Parse the percentage value (handles "+17,54%" or "-5,23%")
        const cleanText = text.replace(',', '.').replace('%', '').replace('+', '');
        const percentage = parseFloat(cleanText) || 0;
        const isPositive = !text.startsWith('-');

        return { percentage, isPositive };
    }

    /**
     * Extracts the price from an element.
     * @param element The share element.
     * @returns The price in euros.
     */
    private _extractPrice(element: HTMLElement): number {
        const priceEl = element.querySelector(SELECTORS.PRICE);
        const text = priceEl?.textContent?.trim() || '0';

        // Parse price (handles "14 €" format)
        const cleanText = text.replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(cleanText) || 0;
    }
}
