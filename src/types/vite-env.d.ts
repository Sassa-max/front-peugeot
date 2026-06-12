
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GRADIO_URL?: string;
  readonly VITE_HOST_ENV?: "local" | "preprod" | "prod";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}