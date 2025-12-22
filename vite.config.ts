import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string; name: string };

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
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
                // Needed for resilient cross-origin update checks (CSP/CORS safe).
                grant: ['GM_addStyle', 'GM_xmlhttpRequest'],
                connect: ['raw.githubusercontent.com'],
            },
        }),
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
