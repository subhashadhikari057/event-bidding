const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export function getMediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
}
