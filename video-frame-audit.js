import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Decode every frame for temporal screening, then send a bounded set of
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
  const frames = [];
  const stills = spawnSync(executable, [
    '-hide_banner', '-loglevel', 'error', '-i', path, '-an',
    '-vf', 'fps=1,scale=480:-2', '-frames:v', '20',
    '-q:v', '7', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'
  ], { ...opts, maxBuffer: 3_000_000 });
  if (stills.status === 0) {
    const buffer = stills.stdout;
    let start = -1;
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i] === 0xff && buffer[i+1] === 0xd8) start = i;
      if (start >= 0 && buffer[i] === 0xff && buffer[i+1] === 0xd9) {
        const frame = buffer.subarray(start, i + 2);
        if (frame.length <= 100_000) frames.push({ seconds: frames.length, data: frame.toString('base64') });
        start = -1;
      }
    }
  }
  return { decoded, frames, limitation: decoded >= 1800
    ? 'El barrido temporal se limitó a los primeros 1 800 cuadros.'
    : '' };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
