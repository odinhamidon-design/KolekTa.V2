/**
 * Bumps the Service Worker CACHE_VERSION to force cache invalidation on deploy.
 * Uses a timestamp-based version so every deploy gets a fresh cache.
 *
 * Run automatically via `npm start` (prestart script).
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const version = Date.now();

try {
  let content = fs.readFileSync(swPath, 'utf8');
  content = content.replace(
    /const CACHE_VERSION = .+;/,
    `const CACHE_VERSION = ${version};`
  );
  fs.writeFileSync(swPath, content, 'utf8');
  console.log(`✅ Service Worker cache version bumped to ${version}`);
} catch (err) {
  console.warn('⚠️  Could not bump SW cache version:', err.message);
}
