import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { Client } from "minio";

export const IMPORTS_BUCKET = process.env.MINIO_BUCKET ?? "mapcanva-imports";

export function createMinioClient(): Client {
  return new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY ?? "mapcanva",
    secretKey: process.env.MINIO_SECRET_KEY ?? "mapcanva123",
  });
}

export async function ensureBucket(client: Client): Promise<void> {
  const exists = await client.bucketExists(IMPORTS_BUCKET).catch(() => false);
  if (!exists) await client.makeBucket(IMPORTS_BUCKET);
}

async function sha256(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function objectExists(client: Client, objectKey: string): Promise<boolean> {
  return client
    .statObject(IMPORTS_BUCKET, objectKey)
    .then(() => true)
    .catch(() => false);
}

export interface ArchiveMetadata {
  jobType: string;
  sourceUrl: string;
  [key: string]: string;
}

/**
 * Archives a raw downloaded file, named by content hash rather than a
 * timestamp — re-running an import against unchanged upstream data (a
 * retried job, a re-triggered "refresh" that finds nothing new) lands on the
 * same key instead of piling up duplicate multi-hundred-MB copies. Real
 * object metadata (source URL, job type, when) is attached so a listing
 * explains itself without cross-referencing the ImportJob table.
 *
 * @returns the object key the file is archived under
 */
export async function archiveFile(
  client: Client,
  localPath: string,
  namePrefix: string,
  extension: string,
  metadata: ArchiveMetadata
): Promise<string> {
  await ensureBucket(client);

  const hash = await sha256(localPath);
  const objectKey = `${namePrefix}-${hash.slice(0, 12)}${extension}`;

  if (await objectExists(client, objectKey)) return objectKey;

  await client.fPutObject(IMPORTS_BUCKET, objectKey, localPath, {
    "x-amz-meta-job-type": metadata.jobType,
    "x-amz-meta-source-url": metadata.sourceUrl,
    "x-amz-meta-archived-at": new Date().toISOString(),
    "x-amz-meta-sha256": hash,
  });
  return objectKey;
}
