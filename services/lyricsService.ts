import { FetchedLyrics, Track } from '../types';

const LRCLIB_BASE_URL = 'https://lrclib.net/api/get';

interface LrcLibResponse {
  plainLyrics?: string;
  syncedLyrics?: string;
  instrumental?: boolean;
}

const stripTimingFromSyncedLyrics = (syncedLyrics: string): string =>
  syncedLyrics
    .split(/\r?\n/)
    .map(line => line.replace(/^\[[^\]]+\]\s*/, '').trim())
    .filter(Boolean)
    .join('\n');

const buildAttempts = (track: Track) => {
  const attempts: URLSearchParams[] = [];
  const roundedDuration = Math.round(track.duration || 0);

  if (track.title && track.artist.name) {
    const full = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist.name
    });

    if (track.album.title) full.set('album_name', track.album.title);
    if (roundedDuration > 0) full.set('duration', String(roundedDuration));
    attempts.push(full);

    const noDuration = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist.name
    });
    if (track.album.title) noDuration.set('album_name', track.album.title);
    attempts.push(noDuration);

    attempts.push(new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist.name
    }));
  }

  return attempts;
};

export const fetchLyricsForTrack = async (
  track: Track,
  signal?: AbortSignal
): Promise<FetchedLyrics | null> => {
  for (const params of buildAttempts(track)) {
    const response = await fetch(`${LRCLIB_BASE_URL}?${params.toString()}`, {
      signal,
      headers: {
        'User-Agent': 'SpoFree/1.0'
      }
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new Error(`LRCLIB request failed with status ${response.status}`);
    }

    const data = (await response.json()) as LrcLibResponse;
    if (data.instrumental) return null;

    const plainLyrics = data.plainLyrics?.trim();
    const syncedLyrics = data.syncedLyrics?.trim();
    const lyrics = plainLyrics || (syncedLyrics ? stripTimingFromSyncedLyrics(syncedLyrics) : '');

    if (!lyrics) {
      continue;
    }

    return {
      lyrics,
      syncedLyrics,
      source: 'LRCLIB',
      updatedAt: Date.now()
    };
  }

  return null;
};
