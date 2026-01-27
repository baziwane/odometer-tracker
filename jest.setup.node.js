// Jest setup for Node.js environment (API routes)
// This file is used for tests that need Node.js environment instead of jsdom

// Mock crypto.randomUUID if not available
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
    },
  })
}
