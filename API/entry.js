'use strict';
const path = require('path');
const { execSync } = require('child_process');

// Detect OpenSSL version and point Prisma to the matching pre-built engine binary.
// This runs BEFORE any require('./dist/server.js') so the env var is set in time.
const enginesDir = path.join(__dirname, 'prisma-engines');

let binary = 'libquery_engine-debian-openssl-1.1.x.so.node';
try {
  const out = execSync('openssl version 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
  if (out.toLowerCase().includes(' 1.0.')) {
    binary = 'libquery_engine-rhel-openssl-1.0.x.so.node';
  }
} catch (_) {}

process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(enginesDir, binary);
console.log('[entry] Prisma engine:', process.env.PRISMA_QUERY_ENGINE_LIBRARY);

require('./dist/server.js');
