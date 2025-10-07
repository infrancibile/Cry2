# Monero Nanopool JS helper
This repository contains a small Node.js helper that will download the latest **XMRig** Linux static binary, extract it and run it configured for Nanopool (Monero).

**Important — be responsible:** this code runs a CPU miner on the host. Do not run it on machines you don't own or administer. Mining consumes CPU and power and can reduce hardware lifetime. I am not responsible for misuse.

## Quick start (Linux)
1. Install Node.js (recommended Node 16+).
2. Download and unzip this repo.
3. From the repo folder, run (replace `YOUR_XMR_WALLET_ADDRESS` with your Monero wallet):
```bash
WALLET=YOUR_XMR_WALLET_ADDRESS WORKER=myrig node index.js
```
- `POOL_HOST` can override the default Nanopool host (default `xmr-eu1.nanopool.org:10343`).
- The script downloads the latest linux static XMRig release and extracts it using the `tar` command (so `tar` must be available).

## Usage notes
- You must supply your Monero wallet address (primary addresses starting with `4` or subaddresses starting with `8`).
- The script will run XMRig with `--tls` (SSL) against the specified Nanopool host and port.
- If you prefer to use a pre-downloaded `xmrig` binary, place it in the repo directory or extracted folder and run `node index.js` with `WALLET` set.
- Edit `index.js` to change donation level (`--donate-level`) or other options — consult XMRig docs for details.

## Files
- `index.js` — main script that downloads & runs XMRig
- `start.sh` — convenience shell wrapper for Linux (make executable)
- `package.json` — basic package file
- `README.md` — this file

## Disclaimer
This repo downloads third-party binaries (XMRig). Verify and inspect before running. Do not use this on machines you do not control. Mining may be illegal or against terms of service in some environments. Use at your own risk.
