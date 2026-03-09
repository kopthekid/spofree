
import { Track } from './types';

// List of public Hifi API instances provided by the user.
export const API_INSTANCES = [
  'https://api.monochrome.tf',
  'https://arran.monochrome.tf',
  'https://triton.squid.wtf',
  'https://wolf.qqdl.site',
  'https://maus.qqdl.site',
  'https://vogel.qqdl.site',
  'https://katze.qqdl.site',
  'https://hund.qqdl.site',
  'https://tidal.kinoplus.online',
  'https://tidal-api.binimum.org',
  'https://triton.squid.wtf',
  'https://hifi-one.spotisaver.net',
  'https://hifi-two.spotisaver.net',
];

// Select the first instance by default
export const API_BASE_URL = API_INSTANCES[0];

export const DEFAULT_VOLUME = 0.5;
