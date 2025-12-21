/**
 * Minimal semantic version comparer supporting "MAJOR.MINOR.PATCH" format.
 * Any non-numeric parts are ignored (e.g. "1.2.3-beta" -> [1,2,3]).
 */
export class Semver {
    public static compare(a: string, b: string): number {
        const pa = Semver._parse(a);
        const pb = Semver._parse(b);

        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const na = pa[i] ?? 0;
            const nb = pb[i] ?? 0;

            if (na > nb) return 1;
            if (na < nb) return -1;
        }

        return 0;
    }

    private static _parse(v: string): number[] {
        return v
            .split('.')
            .map((part) => parseInt(part.replace(/[^0-9].*$/, ''), 10))
            .map((n) => (Number.isFinite(n) ? n : 0));
    }
}
