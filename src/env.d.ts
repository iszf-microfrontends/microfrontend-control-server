declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        PORT: number;
        BACKEND_SERVICES_URL: string;
      }
    }
  }
}
