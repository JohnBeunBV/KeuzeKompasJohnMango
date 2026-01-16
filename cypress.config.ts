import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '.env') });

let testCredentials: { email: string; password: string; username: string } | null = null;

export default defineConfig({
  projectId: "tv5pjo",
  e2e: {
    baseUrl: 'http://localhost:4173',
    setupNodeEvents(on, config) {

      const testPassword = process.env.CYPRESS_TEST_PASSWORD;

      if (!testPassword) {
        console.warn('⚠️ CYPRESS_TEST_PASSWORD not found in environment variables');
      }

      config.env.testPassword = testPassword;

      on('task', {
        saveCredentials(credentials) {
          testCredentials = credentials;
          return null;
        },
        getCredentials() {
          return testCredentials;
        }
      });

      return config;
    }
  }
});