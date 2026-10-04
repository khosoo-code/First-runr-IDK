#!/usr/bin/env node
// Renders an HTML film that follows the render contract in CLAUDE.md.
// The film's index.html sets window.FILM = { width, height, fps, duration, audio? } and
// window.seek(t), which paints frame t. window.ready (optional promise) gates the first frame.
//
//   node render.mjs <film-dir>                    full render -> <film-dir>/out/<name>.mp4
//   node render.mjs <film-dir> --sheet            one frame per hit in beats.json -> out/sheet.png
//   node render.mjs <film-dir> --times 1,2.5,4    those frames as a contact sheet -> out/sheet.png
//
// Options: --fps N  --from S --to S (range)  --offset S (sheet sample offset after each hit)
//          --cols N --thumb PX (sheet layout)  --out PATH
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const filmDir = path.resolve(args.find((a) => !a.startsWith('--')) ?? '');
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);

if (!existsSync(path.join(filmDir, 'index.html'))) {
  console.error('usage: node render.mjs <film-dir> [--sheet | --times a,b,c] [--fps N] [--from S --to S] [--out PATH]');
  process.exit(1);
}
const name = path.basename(filmDir);
const outDir = path.join(filmDir, 'out');
mkdirSync(outDir, { recursive: true });

// Films load ES modules and fonts, which file:// blocks, so serve the film directory.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const file = path.join(filmDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(filmDir) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => msg.type() === 'error' && pageErrors.push(msg.text()));

await page.goto(`${base}/index.html?render`);
await page.waitForFunction(() => window.FILM && typeof window.seek === 'function');
await page.evaluate(async () => {
  await window.ready;
  await document.fonts.ready;
});
const film = await page.evaluate(() => window.FILM);
await page.setViewportSize({ width: film.width, height: film.height });
const fps = Number(opt('fps', film.fps));

async function frameAt(t) {
  await page.evaluate((s) => window.seek(s), t);
  if (pageErrors.length) throw new Error(`page error: ${pageErrors.join('; ')}`);
  return page.screenshot({ type: 'png' });
}

async function contactSheet(samples, file) {
  const cols = Number(opt('cols', 6));
  const thumb = Number(opt('thumb', 300));
  const cells = [];
  for (const s of samples) {
    const png = await frameAt(s.t);
    cells.push(`<figure><img src="data:image/png;base64,${png.toString('base64')}"><figcaption><b>${s.t.toFixed(2)}s</b> ${s.label ?? ''}</figcaption></figure>`);
  }
  const sheet = await browser.newPage({ viewport: { width: cols * (thumb + 16) + 16, height: 400 } });
  await sheet.setContent(`<style>
    body{margin:0;padding:16px;background:#2b2e33;font:13px/1.3 system-ui,sans-serif;color:#e8e9eb;display:grid;grid-template-columns:repeat(${cols},${thumb}px);gap:16px}
    figure{margin:0} img{width:${thumb}px;display:block;border-radius:6px} figcaption{padding-top:6px} b{color:#fff}
  </style>${cells.join('')}`);
  await sheet.screenshot({ path: file, fullPage: true });
  await sheet.close();
  console.log(`sheet: ${path.relative(process.cwd(), file)} (${samples.length} frames)`);
}

async function renderVideo(file) {
  const from = Number(opt('from', 0));
  const to = Math.min(Number(opt('to', film.duration)), film.duration);
  const first = Math.round(from * fps);
  const last = Math.round(to * fps); // exclusive
  const audio = film.audio && existsSync(path.join(filmDir, film.audio)) ? path.join(filmDir, film.audio) : null;
  if (film.audio && !audio) console.warn(`warning: ${film.audio} not found, rendering without audio`);

  const ff = spawn('ffmpeg', [
    '-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    ...(audio ? ['-ss', String(from), '-t', String(to - from), '-i', audio] : []),
    '-map', '0:v', ...(audio ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : []),
    // Chromium paints sRGB; convert with the BT.709 matrix and tag it so players don't shift the colors.
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', file,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));

  const started = Date.now();
  for (let i = first; i < last; i++) {
    const png = await frameAt(i / fps);
    if (!ff.stdin.write(png)) await new Promise((resolve) => ff.stdin.once('drain', resolve));
    if ((i - first) % fps === 0) process.stderr.write(`\rframe ${i - first + 1}/${last - first}`);
  }
  ff.stdin.end();
  await done;
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\rrendered ${last - first} frames at ${fps}fps in ${secs}s -> ${path.relative(process.cwd(), file)}${audio ? ' (with audio)' : ''}`);
}

try {
  if (flag('sheet') || opt('times')) {
    let samples;
    if (opt('times')) {
      samples = opt('times').split(',').map((t) => ({ t: Number(t) }));
    } else {
      const beats = JSON.parse(readFileSync(path.join(filmDir, 'beats.json'), 'utf8'));
      const offset = Number(opt('offset', 0.3));
      samples = beats.hits.map((h) => ({ t: Math.min(h.t + offset, film.duration - 1 / fps), label: h.name }));
    }
    await contactSheet(samples, path.resolve(opt('out', path.join(outDir, 'sheet.png'))));
  } else {
    await renderVideo(path.resolve(opt('out', path.join(outDir, `${name}.mp4`))));
  }
} finally {
  await browser.close();
  server.close();
}
