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
                connect: ['raw.githubusercontent.com'],
                grant: ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_xmlhttpRequest'],
            },
        }),
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                defaults: true,
                drop_debugger: true,
                drop_console: false,
            },
            format: {
                comments: false,
                beautify: true,
            },
            mangle: false,
        },
    },
});
