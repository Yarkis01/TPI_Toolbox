import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

type PackageJson = {
    version: string;
    homepage?: string;
};

function computeRemoteVersionUrl(pkg: PackageJson): string {
    // Default (fallback) - keep in sync with your GitHub repo layout.
    const fallback =
        'https://raw.githubusercontent.com/Yarkis01/TPI_Toolbox/refs/heads/main/src/settings/versions.json?token=GHSAT0AAAAAADRW4AJPJ7WYDBVJICGCMXXG2KIMVUQ';

    if (!pkg.homepage) return fallback;

    // Typical homepage: https://github.com/<owner>/<repo>
    const match = pkg.homepage.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
    if (!match) return fallback;

    const owner = match[1];
    const repo = match[2];

    return `https://raw.githubusercontent.com/${owner}/${repo}/main/src/settings/versions.json`;
}

const pkg = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as PackageJson;

const remoteVersionUrl = computeRemoteVersionUrl(pkg);

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __REMOTE_VERSION_URL__: JSON.stringify(remoteVersionUrl),
    },
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: 'TPI Toolbox',
                version: pkg.version,
                author: 'Yarkis01',
                description: 'A toolbox for TPI enhancing user experience with various features.',
                match: ['https://www.themeparkindustries.com/*'],
                grant: ['GM_addStyle'],
            },
        }),
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
