import { Track } from '../types';

const MAX_NOTIFICATION_LINES = 4;
const MAX_NOTIFICATION_CHARS = 240;

const getNotificationText = (track: Track, autoRomanize = false): string | null => {
  const preferredLyrics = autoRomanize && track.romanizedLyrics?.trim()
    ? track.romanizedLyrics
    : track.lyrics;

  if (!preferredLyrics?.trim()) {
    return null;
  }

  const lines = preferredLyrics
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, MAX_NOTIFICATION_LINES);

  if (lines.length === 0) {
    return null;
  }

  const excerpt = lines.join('\n');
  return excerpt.length > MAX_NOTIFICATION_CHARS
    ? `${excerpt.slice(0, MAX_NOTIFICATION_CHARS - 1).trimEnd()}…`
    : excerpt;
};

export const isLyricsNotificationSupported = (): boolean => (
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'Notification' in window &&
  'serviceWorker' in navigator
);

export const requestLyricsNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isLyricsNotificationSupported()) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return Notification.requestPermission();
};

export const showLyricsNotification = async (
  track: Track,
  options: { autoRomanize?: boolean } = {}
): Promise<boolean> => {
  if (!isLyricsNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const body = getNotificationText(track, options.autoRomanize);
  if (!body) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const tag = `lyrics-${track.id}`;
  const baseUrl = import.meta.env.BASE_URL || './';

  const existingNotifications = await registration.getNotifications({ tag });
  existingNotifications.forEach(notification => notification.close());

  await registration.showNotification(`${track.title} • ${track.artist.name}`, {
    body,
    tag,
    icon: `${baseUrl}ios-logo.png`,
    badge: `${baseUrl}ios-logo.png`,
    data: {
      url: baseUrl,
      trackId: track.id
    },
    silent: true,
    renotify: false
  });

  return true;
};
