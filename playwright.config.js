import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/SE_Tailoring_Framework/',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/SE_Tailoring_Framework/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
