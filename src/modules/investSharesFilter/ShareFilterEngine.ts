import { IShare, IShareFilterCriteria, IShareFilterEngine } from './types';

/**
 * Engine for filtering shares based on criteria.
 */
export class ShareFilterEngine implements IShareFilterEngine {
    /**
     * Filters shares based on criteria.
     * @param shares The shares to filter.
     * @param criteria The filter criteria.
     * @returns Filtered shares.
     */
    public filter(shares: IShare[], criteria: IShareFilterCriteria): IShare[] {
        return shares.filter((share) => this._matchesCriteria(share, criteria));
    }

    /**
     * Gets unique holding tags from shares.
     * @param shares The shares to extract tags from.
     * @returns Array of unique tags sorted alphabetically.
     */
    public getUniqueTags(shares: IShare[]): string[] {
        const tags = new Set<string>();

        shares.forEach((share) => {
            if (share.tag) {
                tags.add(share.tag);
            }
        });

        return Array.from(tags).sort();
    }

    /**
     * Checks if a share matches the filter criteria.
     * @param share The share to check.
     * @param criteria The filter criteria.
     * @returns True if the share matches all criteria.
     */
    private _matchesCriteria(share: IShare, criteria: IShareFilterCriteria): boolean {
        // Check holding tag filter
        if (criteria.holdingTag && share.tag !== criteria.holdingTag) {
            return false;
        }

        // Check minimum index
        if (criteria.minIndex !== undefined && share.indexPercentage < criteria.minIndex) {
            return false;
        }

        // Check maximum index
        if (criteria.maxIndex !== undefined && share.indexPercentage > criteria.maxIndex) {
            return false;
        }

        // Check minimum price
        if (criteria.minPrice !== undefined && share.price < criteria.minPrice) {
            return false;
        }

        // Check maximum price
        if (criteria.maxPrice !== undefined && share.price > criteria.maxPrice) {
            return false;
        }

        // Check positive index only
        if (criteria.positiveIndexOnly && !share.isIndexPositive) {
            return false;
        }

        // Check negative index only
        if (criteria.negativeIndexOnly && share.isIndexPositive) {
            return false;
        }

        return true;
    }
}
