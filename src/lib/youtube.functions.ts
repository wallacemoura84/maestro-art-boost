import { createServerFn } from "@tanstack/react-start";

export type ChannelVideo = { id: string; title: string; published: string };

const CHANNEL_ID = "UC2G-4bthtShSyknAF0JQmOQ";
let cached: { expires: number; videos: ChannelVideo[] } | undefined;

function decodeXml(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (code.startsWith("#")) {
      const number = code[1]?.toLowerCase() === "x"
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10);
      return Number.isFinite(number) && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
    }
    return named[code] ?? entity;
  });
}

export const getLatestVideos = createServerFn({ method: "GET" }).handler(async () => {
  if (cached && cached.expires > Date.now()) return cached.videos;

  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`YouTube feed: ${response.status}`);
    const xml = await response.text();
    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      .map((match) => {
        const entry = match[1] ?? "";
        const id = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
        const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
        return id && title && published ? { id, title: decodeXml(title), published } : null;
      })
      .filter((video): video is ChannelVideo => video !== null)
      .slice(0, 2);

    cached = { videos, expires: Date.now() + 10 * 60_000 };
    return videos;
  } catch {
    return cached?.videos ?? [];
  }
});