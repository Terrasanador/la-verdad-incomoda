import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Compare every decoded frame at low resolution, then send a bounded set of
// representative stills to the visual model. Motion spikes are not proof of AI.
export function auditVideoFrames(bytes, { executable = ffmpegPath } = {}) {
  if (!executable || !bytes?.length) return { decoded: 0, frames: [], limitation: 'No se pudo abrir el video para inspección visual.' };
  const directory = mkdtempSync(join(tmpdir(), 'lvi-frames-'));
  const path = join(directory, 'video.mp4');
  writeFileSync(path, bytes);
  try {
  const opts = { timeout: 20000, maxBuffer: 32_000_000, encoding: null };
  const raw = spawnSync(executable, [
    '-hide_banner', '-loglevel', 'error', '-i', path, '-an',
    '-vf', 'scale=96:96,format=gray', '-frames:v', '1800',
    '-f', 'rawvideo', 'pipe:1'
  ], opts);
  const pixels = 96 * 96;
  const decoded = raw.status === 0 ? Math.floor(raw.stdout.length / pixels) : 0;
  if (!decoded) return { decoded: 0, frames: [], limitation: 'No se pudieron decodificar los fotogramas.' };
  const changes = [];
  for (let frame = 1; frame < decoded; frame++) {
    let total = 0;
    const previous = (frame - 1) * pixels;
    const current = frame * pixels;
    for (let pixel = 0; pixel < pixels; pixel++) {
      total += Math.abs(raw.stdout[current + pixel] - raw.stdout[previous + pixel]);
    }
    changes.push({ cuadro: frame, diferencia_media: Math.round(total / pixels * 10) / 10 });
  }
  const mayoresCambios = changes.sort((a, b) => b.diferencia_media - a.diferencia_media).slice(0, 3);
  const frames = [];
  const interval = Math.max(1, Math.floor((decoded - 1) / 18));
  const stills = spawnSync(executable, [
    '-hide_banner', '-loglevel', 'error', '-i', path, '-an',
    '-vf', `select=not(mod(n\\,${interval}))+eq(n\\,${decoded - 1}),scale=480:-2`, '-vsync', 'vfr', '-frames:v', '20',
    '-q:v', '7', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'
  ], { ...opts, maxBuffer: 3_000_000 });
  if (stills.status === 0) {
    const buffer = stills.stdout;
    let start = -1;
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i] === 0xff && buffer[i+1] === 0xd8) start = i;
      if (start >= 0 && buffer[i] === 0xff && buffer[i+1] === 0xd9) {
        const frame = buffer.subarray(start, i + 2);
        if (frame.length <= 100_000) frames.push({ frame_index: frames.length === 19 ? decoded - 1 : Math.min(decoded - 1, frames.length * interval), data: frame.toString('base64') });
        start = -1;
      }
    }
  }
  return { decoded, frames, mayoresCambios, limitation: decoded >= 1800
    ? 'El barrido temporal se limitó a los primeros 1 800 cuadros.'
    : '' };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
