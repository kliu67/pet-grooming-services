// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    coverage: {
      provider: 'v8',

      reporter: ['text', 'html', 'lcov'],

      reportsDirectory: './coverage',

      include: ['models/**/*.js'],
      exclude: [
        'node_modules/',
        'coverage/',
        '**/__tests__/**'
      ],

      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});