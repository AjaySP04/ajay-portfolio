import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    // The engine is pure TypeScript and the content modules are plain imports;
    // neither needs a DOM.
    environment: 'node',
    include: ['lib/**/*.test.ts', 'content/**/*.test.ts'],
  },
})
