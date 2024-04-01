import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testFiles: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: 'src/test/setup.ts',
  },
})
