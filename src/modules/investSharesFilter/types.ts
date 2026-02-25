/**
 * Types and interfaces for the Invest Shares Filter module.
 */

/**
 * Represents a share available in the market.
 */
export interface IShare {
    /** The unique identifier of the share (part-id) */
    id: string;
    /** The holding tag (e.g., "[DW]") */
    tag: string;
    /** The holding name (e.g., "Dysgloland World") */
    holdingName: string;
    /** The current index percentage (e.g., 17.54 for +17.54%) */
    indexPercentage: number;
    /** Whether the index is positive */
    isIndexPositive: boolean;
    /** The price of the share in euros */
    price: number;
    /** Reference to the DOM element */
    element: HTMLElement;
}

/**
 * Filter criteria for shares.
 */
export interface IShareFilterCriteria {
    /** Filter by holding tag */
    holdingTag?: string;
    /** Minimum index percentage */
    minIndex?: number;
    /** Maximum index percentage */
    maxIndex?: number;
    /** Maximum price */
    maxPrice?: number;
    /** Minimum price */
    minPrice?: number;
    /** Only show positive index shares */
    positiveIndexOnly?: boolean;
    /** Only show negative index shares */
    negativeIndexOnly?: boolean;
}

/**
 * Interface for share data extraction.
 */
export interface IShareParser {
    /**
     * Parses all shares from the DOM.
     * @returns Array of parsed shares.
     */
    parseAll(): IShare[];

    /**
     * Parses a single share element.
     * @param element The share DOM element.
     * @returns The parsed share or null if invalid.
     */
    parse(element: HTMLElement): IShare | null;
}

/**
 * Interface for filtering shares.
 */
export interface IShareFilterEngine {
    /**
     * Filters shares based on criteria.
     * @param shares The shares to filter.
     * @param criteria The filter criteria.
     * @returns Filtered shares.
     */
    filter(shares: IShare[], criteria: IShareFilterCriteria): IShare[];

    /**
     * Gets unique holding tags from shares.
     * @param shares The shares to extract tags from.
     * @returns Array of unique tags.
     */
    getUniqueTags(shares: IShare[]): string[];
}

/**
 * Interface for the filter UI component.
 */
export interface IShareFilterUI {
    /**
     * Renders the filter UI.
     * @param container The container to render into.
     * @param availableTags Available holding tags for filtering.
     */
    render(container: HTMLElement, availableTags: string[]): void;

    /**
     * Gets the current filter criteria from the UI.
     * @returns The current filter criteria.
     */
    getCriteria(): IShareFilterCriteria;

    /**
     * Sets the filter criteria in the UI.
     * @param criteria The criteria to set.
     */
    setCriteria(criteria: IShareFilterCriteria): void;

    /**
     * Sets a callback for when filters change.
     * @param callback The callback function.
     */
    onFilterChange(callback: () => void): void;

    /**
     * Destroys the UI and cleans up.
     */
    destroy(): void;
}
