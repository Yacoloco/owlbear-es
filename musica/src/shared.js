export const ID = "com.yacoloco.musica";
export const STATE_KEY = `${ID}/state`;
export const LIBRARY_KEY = `${ID}/library`;

/**
 * Lee un link de YouTube y devuelve qué es.
 * Acepta playlists (list=...), videos (v=..., youtu.be/..., /shorts/, /embed/, /live/)
 * o un video dentro de una playlist (devuelve la playlist).
 */
export function parseYouTube(input) {
  const text = (input || "").trim();
  if (!text) return null;
  let url;
  try {
    url = new URL(text.startsWith("http") ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\.|^music\./, "");
  if (!["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) return null;

  const list = url.searchParams.get("list");
  let video = url.searchParams.get("v");
  if (!video && host === "youtu.be") video = url.pathname.slice(1).split("/")[0];
  if (!video) {
    const m = url.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/);
    if (m) video = m[2];
  }
  if (list && !list.startsWith("RD")) {
    return { kind: "playlist", id: list, video: video || null };
  }
  if (video) return { kind: "video", id: video };
  return null;
}

export const CHANNELS = [
  { id: "musica", label: "Música", icon: "🎵" },
  { id: "ambiente", label: "Ambiente", icon: "🌧️" },
];
