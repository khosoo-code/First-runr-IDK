// Verifies the motion-studio toolchain: ffmpeg, the Python audio venv,
// Playwright + Chromium, and the claude-animation plugin's canvas dependency.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let failed = 0;

async function check(name, fn) {
  try {
    console.log(`✓ ${name}: ${await fn()}`);
  } catch (err) {
    failed++;
    console.log(`✗ ${name}: ${String(err?.message ?? err).split('\n')[0]}`);
  }
}

await check('ffmpeg', () => execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split('\n')[0]);

await check('python audio', () => {
  const python = path.join(root, '.venv/bin/python');
  if (!existsSync(python)) throw new Error('.venv missing; run .claude/hooks/session-start.sh');
  const code = 'import numpy, librosa, soundfile; print(f"numpy {numpy.__version__}, librosa {librosa.__version__}, soundfile {soundfile.__version__}")';
  return execFileSync(python, ['-c', code], { encoding: 'utf8' }).trim();
});

await check('playwright', async () => {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<p>ok</p>');
    if ((await page.textContent('p')) !== 'ok') throw new Error('page did not render');
    return `chromium ${browser.version()}`;
  } finally {
    await browser.close();
  }
});

await check('claude-animation', () => {
  const base = path.join(homedir(), '.claude/plugins/cache/claude-animation-skill/claude-animation');
  const versions = existsSync(base) ? readdirSync(base).sort() : [];
  if (!versions.length) throw new Error('plugin not installed; run .claude/hooks/session-start.sh');
  const version = versions.at(-1);
  const skillDir = path.join(base, version, 'skills/claude-animation');
  const { createCanvas } = createRequire(path.join(skillDir, 'package.json'))('@napi-rs/canvas');
  createCanvas(4, 4).getContext('2d').fillRect(0, 0, 4, 4);
  return `plugin ${version}, @napi-rs/canvas ok`;
});

process.exit(failed ? 1 : 0);
