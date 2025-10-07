#!/usr/bin/env node
'use strict';
/*
 Simple Node.js helper that:
 1. Fetches XMRig latest release info from xmrig.com API
 2. Downloads a linux-static-x64 binary tarball (if available)
 3. Extracts it (requires `tar` on the host)
 4. Runs xmrig against Nanopool using provided WALLET and optional WORKER/POOL env vars

 Usage:
  - Set your Monero address in env WALLET (or pass as first arg)
  - Optionally set WORKER (defaults to 'worker1') and POOL_HOST (defaults to xmr-eu1.nanopool.org:10343)
  - Run: node index.js
*/

const https = require('https');
const fs = require('fs');
const { spawnSync, spawn } = require('child_process');
const path = require('path');

const API = 'https://xmrig.com/docs/api/1/latest_release';
const outTar = path.join(__dirname, 'xmrig.tar.gz');

function log(...args){ console.log('[*]', ...args); }

async function fetchJson(url){
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        try{ res(JSON.parse(body)); } catch(e){ rej(e); }
      });
    }).on('error', rej);
  });
}

async function download(url, dest){
  return new Promise((res, rej) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (r) => {
      if(r.statusCode >= 300 && r.headers.location){
        // follow redirect
        return download(r.headers.location, dest).then(res).catch(rej);
      }
      r.pipe(file);
      file.on('finish', () => file.close(res));
    }).on('error', (err) => {
      try{ fs.unlinkSync(dest); }catch(_){}
      rej(err);
    });
  });
}

(async ()=>{
  try{
    const wallet = process.env.WALLET || process.argv[2];
    if(!wallet){
      console.error('ERROR: set your Monero address in env WALLET or pass it as first argument.');
      console.error('Example: WALLET=44... node index.js');
      process.exit(2);
    }
    const worker = process.env.WORKER || 'worker1';
    const pool = process.env.POOL_HOST || 'xmr-eu1.nanopool.org:10343'; // default European SSL port
    log('fetching latest XMRig release info...');
    const data = await fetchJson(API);
    if(!data || !Array.isArray(data.assets)){
      throw new Error('unexpected API response');
    }
    // prefer linux-static-x64, fall back to linux-x64
    let asset = data.assets.find(a => a.name && a.name.includes('linux-static-x64'));
    if(!asset) asset = data.assets.find(a => a.name && a.name.includes('linux-x64'));
    if(!asset){
      throw new Error('no suitable linux asset found in latest release assets');
    }
    log('selected asset:', asset.name);
    const url = asset.browser_download_url || asset.url || asset.download_url || asset;
    // asset object from xmrig API provides direct URLs inside .url field which may point to release page; but assets may contain browser_download_url
    // We'll prefer browser_download_url
    let downloadUrl = null;
    if(typeof asset === 'string') downloadUrl = asset;
    else if(asset.browser_download_url) downloadUrl = asset.browser_download_url;
    else if(asset.url) downloadUrl = asset.url;
    else throw new Error('cannot determine download URL for asset');

    log('downloading', downloadUrl, '->', outTar);
    await download(downloadUrl, outTar);
    log('download complete');
    // extract tar.gz (requires `tar` in PATH)
    log('extracting archive (requires `tar`)');
    const ex = spawnSync('tar', ['-xzf', outTar], {cwd: __dirname, stdio: 'inherit'});
    if(ex.error){
      throw ex.error;
    }
    // find xmrig executable under extracted folder
    const files = fs.readdirSync(__dirname);
    const xmrigDir = files.find(f => f.startsWith('xmrig') && fs.statSync(path.join(__dirname, f)).isDirectory());
    let xmrigPath = null;
    if(xmrigDir){
      const candidate = path.join(__dirname, xmrigDir, 'xmrig');
      if(fs.existsSync(candidate)) xmrigPath = candidate;
    }
    // fallback: search for any file named 'xmrig' recursively
    if(!xmrigPath){
      const walk = (dir) => {
        for(const e of fs.readdirSync(dir)){
          const p = path.join(dir, e);
          try{
            const st = fs.statSync(p);
            if(st.isDirectory()) {
              const r = walk(p);
              if(r) return r;
            } else if(st.isFile() && e === 'xmrig') return p;
          }catch(err){}
        }
        return null;
      };
      xmrigPath = walk(__dirname);
    }
    if(!xmrigPath) throw new Error('xmrig binary not found after extraction');

    // make executable
    try{ fs.chmodSync(xmrigPath, 0o755); }catch(_){}

    log('starting xmrig:', xmrigPath);
    // build arguments: -o <pool> -u <wallet> -p <worker> --tls
    const args = ['-o', pool, '-u', wallet, '-p', worker, '--donate-level', '1', '--tls'];
    log('args:', args.join(' '));
    const proc = spawn(xmrigPath, args, {cwd: path.dirname(xmrigPath), stdio: 'inherit'});
    proc.on('exit', (code, sig) => {
      log('xmrig exited', code, sig);
    });
    proc.on('error', (err) => {
      console.error('failed to start xmrig:', err);
    });
  }catch(err){
    console.error('ERROR:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
