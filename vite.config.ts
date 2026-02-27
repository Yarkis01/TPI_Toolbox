import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

import { version } from './package.json';

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: 'TPI Toolbox',
                version,
                author: 'Yarkis01 & MarcusIsLion',
                description: 'A toolbox for TPI enhancing user experience with various features.',
                match: ['https://*.themeparkindustries.com/*'],
                grant: ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue'],
                source: 'https://github.com/Yarkis01/TPI_Toolbox',
                homepageURL: 'https://github.com/Yarkis01/TPI_Toolbox',
                supportURL: 'https://github.com/Yarkis01/TPI_Toolbox/issues',
                license: 'GPL-3.0',
            },
        }),
    ],
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    },
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
