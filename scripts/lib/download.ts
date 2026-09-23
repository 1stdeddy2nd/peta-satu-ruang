import { createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";
import unzipper from "unzipper";

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number | null;
  percent: number | null;
}

const MAX_ATTEMPTS = 8;

/** Streams a URL to a local file. Retries a dropped connection by resuming
 * with `Range` from what's already on disk instead of restarting from
 * zero — a multi-GB download otherwise loses all progress on one reset.
 * Falls back to a clean restart if the server ignores the Range header. */
export async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  let totalBytes: number | null = null;
  let bytesDownloaded = 0;
  let lastReportedAt = 0;

  const report = (force = false) => {
    if (!onProgress) return;
    const now = Date.now();
    if (!force && now - lastReportedAt < 1000) return;
    lastReportedAt = now;
    onProgress({
      bytesDownloaded,
      totalBytes,
      percent: totalBytes ? Math.round((bytesDownloaded / totalBytes) * 100) : null,
    });
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let resumeFrom = await stat(destPath)
      .then((s) => s.size)
      .catch(() => 0);

    const res = await fetch(url, resumeFrom > 0 ? { headers: { Range: `bytes=${resumeFrom}-` } } : {});

    if (resumeFrom > 0 && res.status !== 206) {
      // Server ignored the Range request — can't append, start clean.
      await rm(destPath, { force: true });
      resumeFrom = 0;
    }
    if (!res.ok && res.status !== 206) {
      throw new Error(`Download failed: ${res.status} ${res.statusText} (${url})`);
    }
    if (!res.body) throw new Error(`Download failed: empty body (${url})`);

    if (totalBytes == null) {
      const contentLength = Number(res.headers.get("content-length")) || null;
      totalBytes =
        res.status === 206 && contentLength ? contentLength + resumeFrom : contentLength;
    }

    bytesDownloaded = resumeFrom;
    const progressTracker = new Transform({
      transform(chunk, _encoding, callback) {
        bytesDownloaded += chunk.length;
        report();
        callback(null, chunk);
      },
    });

    try {
      await pipeline(
        Readable.fromWeb(res.body as never),
        progressTracker,
        createWriteStream(destPath, { flags: res.status === 206 ? "a" : "w" })
      );
      report(true);
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      const delayMs = Math.min(2 ** attempt * 1000, 30_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/** Extracts one named entry from a local zip to a destination path. */
export async function extractEntry(
  zipPath: string,
  entryName: string,
  destPath: string
): Promise<void> {
  const directory = await unzipper.Open.file(zipPath);
  const entry = directory.files.find((f) => f.path === entryName);
  if (!entry) {
    throw new Error(`Entry "${entryName}" not found in ${zipPath}`);
  }
  await pipeline(entry.stream(), createWriteStream(destPath));
}
