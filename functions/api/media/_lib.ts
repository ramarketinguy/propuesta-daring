const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
const ALLOWED_PLACEMENTS = new Set(['pizza', 'testimonials', 'history', 'product']);
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']);

export function mediaLimit(mimeType: string): number {
  return mimeType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function validMedia(mimeType: string, size: number): boolean {
  return ALLOWED_TYPES.has(mimeType) && size > 0 && size <= mediaLimit(mimeType);
}

export function validPlacement(value: string): boolean {
  return ALLOWED_PLACEMENTS.has(value);
}

export function safeFileName(value: string): string {
  return value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 100) || 'media';
}

export function mediaKey(placement: string, fileName: string): string {
  return `${placement}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}
