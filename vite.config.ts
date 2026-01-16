
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files and system environment
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize system environment variable, then loaded env file.
  // REMOVED hardcoded fallback to prevent security leaks.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
