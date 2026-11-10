import { GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const UPLOAD_TTL_SECONDS = 15 * 60;
const PLAYBACK_TTL_SECONDS = 60 * 60;

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Cloudflare R2 is not configured");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

let client: S3Client | null = null;

function getClient() {
  if (!client) {
    const config = getConfig();
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return client;
}

export function createVideoKey(lessonId: string, contentType: string) {
  const extension = ALLOWED_VIDEO_TYPES[contentType];
  return `lessons/${lessonId}/${crypto.randomUUID()}.${extension}`;
}

export async function createVideoUploadUrl(key: string, contentType: string) {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: getConfig().bucket, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_TTL_SECONDS },
  );
}

export async function createVideoPlaybackUrl(key: string) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: getConfig().bucket, Key: key }),
    { expiresIn: PLAYBACK_TTL_SECONDS },
  );
}

export async function getVideoObjectSize(key: string) {
  try {
    const result = await getClient().send(new HeadObjectCommand({ Bucket: getConfig().bucket, Key: key }));
    return result.ContentLength ?? null;
  } catch {
    return null;
  }
}

export async function deleteVideoObject(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getConfig().bucket, Key: key }));
}
