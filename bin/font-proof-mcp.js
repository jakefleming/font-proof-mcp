#!/usr/bin/env node
/**
 * font-proof-mcp: launcher for the Font Proof MCP server.
 *
 * The actual MCP server is a Swift binary that ships inside the Font Proof
 * app bundle (Contents/Helpers/font-proof-mcp), codesigned with the app and
 * always in sync with the app's document format. This package just finds it
 * and hands over stdio, so MCP clients can use the standard `npx` install
 * path without this package duplicating any server logic.
 *
 * Resolution order:
 *   1. FONT_PROOF_MCP_PATH environment variable (explicit override)
 *   2. /Applications/Font Proof.app
 *   3. ~/Applications/Font Proof.app
 *   4. Spotlight lookup by bundle id (com.FontProof)
 *
 * All diagnostics go to stderr; stdout is reserved for MCP JSON-RPC.
 */

'use strict';

const { spawn, execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const os = require('node:os');

const HELPER_RELATIVE = 'Contents/Helpers/font-proof-mcp';
const BUNDLE_ID = 'com.FontProof';

function findServerBinary() {
  const override = process.env.FONT_PROOF_MCP_PATH;
  if (override) {
    if (existsSync(override)) return override;
    process.stderr.write(
      `font-proof-mcp: FONT_PROOF_MCP_PATH is set but does not exist: ${override}\n`
    );
    process.exit(1);
  }

  const candidates = [
    join('/Applications', 'Font Proof.app', HELPER_RELATIVE),
    join(os.homedir(), 'Applications', 'Font Proof.app', HELPER_RELATIVE),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Fall back to Spotlight in case the app lives somewhere unusual.
  try {
    const out = execFileSync(
      'mdfind',
      [`kMDItemCFBundleIdentifier == '${BUNDLE_ID}'`],
      { encoding: 'utf8', timeout: 5000 }
    );
    for (const appPath of out.split('\n')) {
      if (!appPath) continue;
      const helper = join(appPath.trim(), HELPER_RELATIVE);
      if (existsSync(helper)) return helper;
    }
  } catch {
    // mdfind unavailable or timed out; fall through to the error below.
  }

  return null;
}

function main() {
  if (process.platform !== 'darwin') {
    process.stderr.write(
      'font-proof-mcp: Font Proof is a macOS app; this MCP server only runs on macOS.\n'
    );
    process.exit(1);
  }

  const binary = findServerBinary();
  if (!binary) {
    process.stderr.write(
      [
        'font-proof-mcp: could not find the Font Proof app.',
        'The MCP server ships inside the Font Proof app bundle.',
        'Install Font Proof from https://fontproof.com and try again.',
        'If the app is installed in a non-standard location, set',
        'FONT_PROOF_MCP_PATH to the full path of',
        `"Font Proof.app/${HELPER_RELATIVE}".`,
        '',
      ].join('\n')
    );
    process.exit(1);
  }

  const child = spawn(binary, process.argv.slice(2), { stdio: 'inherit' });

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => child.kill(signal));
  }

  child.on('error', (err) => {
    process.stderr.write(`font-proof-mcp: failed to launch server: ${err.message}\n`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

main();
