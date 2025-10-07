#!/usr/bin/env bash
# Quick start wrapper for Linux
if [ -z "$WALLET" ]; then
  echo "Please set WALLET env variable: export WALLET=44..."
  echo "Usage: WALLET=44... WORKER=myrig ./start.sh"
  exit 1
fi
WORKER=${WORKER:-worker1}
POOL_HOST=${POOL_HOST:-xmr-eu1.nanopool.org:10343}
node index.js
