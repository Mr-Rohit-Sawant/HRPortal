#!/bin/bash
# Auto-detect the correct Prisma Linux binary based on OpenSSL version
DIR="$(cd "$(dirname "$0")" && pwd)"

OPENSSL_VER=$(openssl version 2>/dev/null | awk '{print $2}' | cut -d. -f1,2)

if [[ "$OPENSSL_VER" == "1.0"* ]]; then
  export PRISMA_QUERY_ENGINE_LIBRARY="$DIR/prisma-engines/libquery_engine-rhel-openssl-1.0.x.so.node"
else
  export PRISMA_QUERY_ENGINE_LIBRARY="$DIR/prisma-engines/libquery_engine-debian-openssl-1.1.x.so.node"
fi

echo "Using Prisma engine: $PRISMA_QUERY_ENGINE_LIBRARY"
exec node dist/server.js
