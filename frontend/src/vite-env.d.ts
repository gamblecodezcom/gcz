/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for your FastAPI backend
   * Example: https://gamblecodez.com or http://localhost:3000
   */
  readonly VITE_API_BASE_URL: string;

  /**
   * Optional: enable debug logs in development
   */
  readonly VITE_DEBUG?: string;

  /**
   * Optional: PWA versioning
   */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
