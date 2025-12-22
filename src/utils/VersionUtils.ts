/**
 * Utilities for comparing semantic version strings.
 */
export class VersionUtils {
    /**
     * Compares two version strings.
     * @returns 1 if a > b, -1 if a < b, 0 if equal.
     */
    public static compare(a: string, b: string): number {
        const pa = VersionUtils._toParts(a);
        const pb = VersionUtils._toParts(b);

        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const av = pa[i] ?? 0;
            const bv = pb[i] ?? 0;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }

        return 0;
    }

    /**
     * Converts a version string to a numeric parts array.
     * Non-numeric components are ignored (e.g. "1.2.3-beta" -> [1,2,3]).
     */
    private static _toParts(version: string): number[] {
        return version
            .trim()
            .split('.')
            .map((p) => {
                const match = p.match(/\d+/);
                return match ? Number(match[0]) : 0;
            });
    }
}
