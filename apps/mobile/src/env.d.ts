declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        EXPO_PUBLIC_API_URL?: string;
        EXPO_PUBLIC_SUPABASE_URL?: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
        EXPO_PUBLIC_ENABLE_JOB_REQUESTS?: string;
        EXPO_PUBLIC_ENABLE_QUOTE_MARKETPLACE?: string;
      }
    }
    var process: {
      env: NodeJS.ProcessEnv;
    };
  }
}
