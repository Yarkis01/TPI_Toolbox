/// <reference types="vite/client" />

/**
 * Interface for environment variables.
 */
interface ImportMetaEnv {
    readonly VITE_APP_VERSION: string;
}

/**
 * Interface for import meta.
 */
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
