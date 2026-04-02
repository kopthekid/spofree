

import { Track, Playlist, LocalStorageData, AudioQuality, RecentlyPlayedItem, Album, Artist, CustomLyrics, FetchedLyrics, GeneratedRomanization } from '../types';

const STORAGE_KEY = 'spofreefy_data_v1';

const toTrackKey = (trackId: string | number) => String(trackId);

const stripLyricsFromTrack = (track: Track): Track => {
  const { lyrics, syncedLyrics, romanizedLyrics, lyricsLanguage, lyricsSource, ...rest } = track;
  return rest as Track;
};

const applyLyricsToTrack = (
  track: Track,
  fetchedLyrics?: FetchedLyrics,
  customLyrics?: CustomLyrics,
  generatedRomanization?: GeneratedRomanization
): Track => {
  let hydratedTrack: Track = stripLyricsFromTrack(track);

  if (fetchedLyrics) {
    hydratedTrack = {
      ...hydratedTrack,
      lyrics: fetchedLyrics.lyrics,
      syncedLyrics: fetchedLyrics.syncedLyrics,
      lyricsSource: fetchedLyrics.source
    };
  }

  if (customLyrics) {
    hydratedTrack = {
      ...hydratedTrack,
      lyrics: customLyrics.lyrics,
      romanizedLyrics: customLyrics.romanizedLyrics,
      lyricsLanguage: customLyrics.lyricsLanguage,
      lyricsSource: 'CUSTOM'
    };
  }

  if (
    generatedRomanization &&
    hydratedTrack.lyrics &&
    generatedRomanization.lyrics === hydratedTrack.lyrics &&
    !hydratedTrack.romanizedLyrics
  ) {
    hydratedTrack = {
      ...hydratedTrack,
      romanizedLyrics: generatedRomanization.romanizedLyrics
    };
  }

  return hydratedTrack;
};

const applyLyricsToPlaylist = (
  playlist: Playlist,
  fetchedLyricsMap: Record<string, FetchedLyrics>,
  customLyricsMap: Record<string, CustomLyrics>,
  generatedRomanizationsMap: Record<string, GeneratedRomanization>
): Playlist => ({
  ...playlist,
  tracks: playlist.tracks?.map(track => applyLyricsToTrack(
    track,
    fetchedLyricsMap[toTrackKey(track.id)],
    customLyricsMap[toTrackKey(track.id)],
    generatedRomanizationsMap[toTrackKey(track.id)]
  )) || []
});

const applyLyricsToRecentItem = (
  item: RecentlyPlayedItem,
  fetchedLyricsMap: Record<string, FetchedLyrics>,
  customLyricsMap: Record<string, CustomLyrics>,
  generatedRomanizationsMap: Record<string, GeneratedRomanization>
): RecentlyPlayedItem => {
  if (item.type !== 'TRACK') return item;

  return {
    ...item,
    data: applyLyricsToTrack(
      item.data as Track,
      fetchedLyricsMap[toTrackKey((item.data as Track).id)],
      customLyricsMap[toTrackKey((item.data as Track).id)],
      generatedRomanizationsMap[toTrackKey((item.data as Track).id)]
    )
  };
};

const getStorage = (): LocalStorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  const defaultData: LocalStorageData = { 
    likedSongs: [], 
    playlists: [], 
    savedAlbums: [],
    followedArtists: [],
    customLyrics: {},
    fetchedLyrics: {},
    generatedRomanizations: {},
    searchHistory: [],
    audioQuality: 'LOSSLESS',
    recentlyPlayed: [],
    accentColor: '#1db954',
    showVisualizer: true,
    showStats: false,
    compactMode: false,
    reducedMotion: false,
    grayscaleMode: false,
    squareAvatars: false,
    highPerformanceMode: false,
    disableGlow: false,
    autoRomanizeLyrics: false,
    updateTitle: true
  };
  
  if (!data) return defaultData;
  
  try {
      const parsed = JSON.parse(data);
      return { ...defaultData, ...parsed }; // Merge to ensure new fields exist
  } catch (e) {
      return defaultData;
  }
};

const setStorage = (data: LocalStorageData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const storageService = {
  // --- Lyrics ---
  getCustomLyrics: (trackId: string | number): CustomLyrics | null => {
    return getStorage().customLyrics[toTrackKey(trackId)] || null;
  },

  getFetchedLyrics: (trackId: string | number): FetchedLyrics | null => {
    return getStorage().fetchedLyrics[toTrackKey(trackId)] || null;
  },

  getGeneratedRomanization: (trackId: string | number): GeneratedRomanization | null => {
    return getStorage().generatedRomanizations[toTrackKey(trackId)] || null;
  },

  hydrateTrack: (track: Track): Track => {
    const data = getStorage();
    return applyLyricsToTrack(
      track,
      data.fetchedLyrics[toTrackKey(track.id)],
      data.customLyrics[toTrackKey(track.id)],
      data.generatedRomanizations[toTrackKey(track.id)]
    );
  },

  hydrateTracks: (tracks: Track[]): Track[] => {
    const data = getStorage();
    return tracks.map(track => applyLyricsToTrack(
      track,
      data.fetchedLyrics[toTrackKey(track.id)],
      data.customLyrics[toTrackKey(track.id)],
      data.generatedRomanizations[toTrackKey(track.id)]
    ));
  },

  saveFetchedLyrics: (trackId: string | number, payload: { lyrics: string; syncedLyrics?: string }): FetchedLyrics => {
    const data = getStorage();
    const saved: FetchedLyrics = {
      lyrics: payload.lyrics.trim(),
      syncedLyrics: payload.syncedLyrics?.trim() || undefined,
      source: 'LRCLIB',
      updatedAt: Date.now()
    };

    data.fetchedLyrics[toTrackKey(trackId)] = saved;
    setStorage(data);
    return saved;
  },

  saveGeneratedRomanization: (
    trackId: string | number,
    payload: { lyrics: string; romanizedLyrics: string }
  ): GeneratedRomanization => {
    const data = getStorage();
    const saved: GeneratedRomanization = {
      lyrics: payload.lyrics.trim(),
      romanizedLyrics: payload.romanizedLyrics.trim(),
      updatedAt: Date.now()
    };

    data.generatedRomanizations[toTrackKey(trackId)] = saved;
    setStorage(data);
    return saved;
  },

  saveCustomLyrics: (
    trackId: string | number,
    payload: { lyrics: string; romanizedLyrics?: string; lyricsLanguage?: CustomLyrics['lyricsLanguage'] }
  ): CustomLyrics => {
    const data = getStorage();
    const lyrics = payload.lyrics.trim();
    const romanizedLyrics = payload.romanizedLyrics?.trim() || undefined;

    const saved: CustomLyrics = {
      lyrics,
      romanizedLyrics,
      lyricsLanguage: payload.lyricsLanguage,
      updatedAt: Date.now()
    };

    data.customLyrics[toTrackKey(trackId)] = saved;
    setStorage(data);
    return saved;
  },

  removeCustomLyrics: (trackId: string | number) => {
    const data = getStorage();
    const key = toTrackKey(trackId);
    delete data.customLyrics[key];
    data.likedSongs = data.likedSongs.map(track => track.id === trackId ? stripLyricsFromTrack(track) : track);
    data.playlists = data.playlists.map(playlist => ({
      ...playlist,
      tracks: playlist.tracks?.map(track => track.id === trackId ? stripLyricsFromTrack(track) : track) || []
    }));
    data.recentlyPlayed = data.recentlyPlayed.map(item => (
      item.type === 'TRACK' && (item.data as Track).id === trackId
        ? { ...item, data: stripLyricsFromTrack(item.data as Track) }
        : item
    ));
    setStorage(data);
  },

  // --- Settings ---
  getQuality: (): AudioQuality => {
      return getStorage().audioQuality;
  },

  setQuality: (quality: AudioQuality) => {
      const data = getStorage();
      data.audioQuality = quality;
      setStorage(data);
  },

  getAccentColor: (): string => {
    return getStorage().accentColor;
  },

  setAccentColor: (color: string) => {
    const data = getStorage();
    data.accentColor = color;
    setStorage(data);
  },

  getShowVisualizer: (): boolean => {
    return getStorage().showVisualizer;
  },

  setShowVisualizer: (show: boolean) => {
    const data = getStorage();
    data.showVisualizer = show;
    setStorage(data);
  },

  getShowStats: (): boolean => {
    return getStorage().showStats;
  },

  setShowStats: (show: boolean) => {
    const data = getStorage();
    data.showStats = show;
    setStorage(data);
  },

  getCompactMode: (): boolean => {
    return getStorage().compactMode;
  },

  setCompactMode: (enabled: boolean) => {
    const data = getStorage();
    data.compactMode = enabled;
    setStorage(data);
  },

  getReducedMotion: (): boolean => {
    return getStorage().reducedMotion;
  },

  setReducedMotion: (enabled: boolean) => {
    const data = getStorage();
    data.reducedMotion = enabled;
    setStorage(data);
  },

  getGrayscaleMode: (): boolean => {
    return getStorage().grayscaleMode;
  },

  setGrayscaleMode: (enabled: boolean) => {
    const data = getStorage();
    data.grayscaleMode = enabled;
    setStorage(data);
  },

  getSquareAvatars: (): boolean => {
    return getStorage().squareAvatars;
  },

  setSquareAvatars: (enabled: boolean) => {
    const data = getStorage();
    data.squareAvatars = enabled;
    setStorage(data);
  },

  getHighPerformanceMode: (): boolean => {
    return getStorage().highPerformanceMode;
  },

  setHighPerformanceMode: (enabled: boolean) => {
    const data = getStorage();
    data.highPerformanceMode = enabled;
    setStorage(data);
  },
  
  getDisableGlow: (): boolean => {
    return getStorage().disableGlow;
  },

  setDisableGlow: (enabled: boolean) => {
    const data = getStorage();
    data.disableGlow = enabled;
    setStorage(data);
  },

  getAutoRomanizeLyrics: (): boolean => {
    return getStorage().autoRomanizeLyrics;
  },

  setAutoRomanizeLyrics: (enabled: boolean) => {
    const data = getStorage();
    data.autoRomanizeLyrics = enabled;
    setStorage(data);
  },

  getUpdateTitle: (): boolean => {
    return getStorage().updateTitle;
  },

  setUpdateTitle: (enabled: boolean) => {
    const data = getStorage();
    data.updateTitle = enabled;
    setStorage(data);
  },

  // --- Liked Songs ---
  getLikedSongs: (): Track[] => {
    const data = getStorage();
    return data.likedSongs.map(track => applyLyricsToTrack(
      track,
      data.fetchedLyrics[toTrackKey(track.id)],
      data.customLyrics[toTrackKey(track.id)],
      data.generatedRomanizations[toTrackKey(track.id)]
    ));
  },
  
  toggleLikeSong: (track: Track): boolean => {
    const data = getStorage();
    const hydratedTrack = applyLyricsToTrack(
      track,
      data.fetchedLyrics[toTrackKey(track.id)],
      data.customLyrics[toTrackKey(track.id)],
      data.generatedRomanizations[toTrackKey(track.id)]
    );
    const exists = data.likedSongs.some(t => t.id === track.id);
    
    if (exists) {
      data.likedSongs = data.likedSongs.filter(t => t.id !== track.id);
    } else {
      data.likedSongs = [hydratedTrack, ...data.likedSongs];
    }
    setStorage(data);
    return !exists;
  },

  isLiked: (trackId: string | number): boolean => {
    return getStorage().likedSongs.some(t => t.id === trackId);
  },

  // --- Saved Albums ---
  getSavedAlbums: (): Album[] => {
      return getStorage().savedAlbums;
  },

  toggleSaveAlbum: (album: Album): boolean => {
      const data = getStorage();
      const exists = data.savedAlbums.some(a => a.id === album.id);
      if (exists) {
          data.savedAlbums = data.savedAlbums.filter(a => a.id !== album.id);
      } else {
          data.savedAlbums = [album, ...data.savedAlbums];
      }
      setStorage(data);
      return !exists;
  },

  isAlbumSaved: (albumId: string | number): boolean => {
      return getStorage().savedAlbums.some(a => a.id === albumId);
  },

  // --- Followed Artists ---
  getFollowedArtists: (): Artist[] => {
      return getStorage().followedArtists;
  },

  toggleFollowArtist: (artist: Artist): boolean => {
      const data = getStorage();
      const exists = data.followedArtists.some(a => a.id === artist.id);
      if (exists) {
          data.followedArtists = data.followedArtists.filter(a => a.id !== artist.id);
      } else {
          data.followedArtists = [artist, ...data.followedArtists];
      }
      setStorage(data);
      return !exists;
  },

  isArtistFollowed: (artistId: string | number): boolean => {
      return getStorage().followedArtists.some(a => a.id === artistId);
  },

  // --- Playlists ---
  getPlaylists: (): Playlist[] => {
    const data = getStorage();
    return data.playlists.map(playlist => applyLyricsToPlaylist(playlist, data.fetchedLyrics, data.customLyrics, data.generatedRomanizations));
  },

  savePlaylist: (playlist: Playlist): boolean => {
      const data = getStorage();
      const exists = data.playlists.some(p => p.uuid === playlist.uuid);
      if (exists) {
          data.playlists = data.playlists.filter(p => p.uuid !== playlist.uuid);
      } else {
          data.playlists.push({ ...playlist, isLocal: playlist.isLocal ?? false });
      }
      setStorage(data);
      return !exists;
  },

  isPlaylistSaved: (uuid: string): boolean => {
      return getStorage().playlists.some(p => p.uuid === uuid);
  },

  createPlaylist: (title: string): Playlist => {
    const data = getStorage();
    const newPlaylist: Playlist = {
      uuid: crypto.randomUUID(),
      title,
      description: '',
      image: 'https://via.placeholder.com/300?text=' + encodeURIComponent(title),
      creator: { name: 'You' },
      isLocal: true,
      tracks: []
    };
    data.playlists.push(newPlaylist);
    setStorage(data);
    return newPlaylist;
  },

  updatePlaylist: (uuid: string, updates: { title?: string, description?: string, image?: string }) => {
    const data = getStorage();
    const playlist = data.playlists.find(p => p.uuid === uuid);
    if (playlist) {
      if (updates.title !== undefined) playlist.title = updates.title;
      if (updates.description !== undefined) playlist.description = updates.description;
      if (updates.image !== undefined) playlist.image = updates.image;
      setStorage(data);
    }
  },

  updatePlaylistTracks: (uuid: string, tracks: Track[]) => {
      const data = getStorage();
      const playlist = data.playlists.find(p => p.uuid === uuid);
      if (playlist) {
          playlist.tracks = tracks.map(track => applyLyricsToTrack(
            track,
            data.fetchedLyrics[toTrackKey(track.id)],
            data.customLyrics[toTrackKey(track.id)],
            data.generatedRomanizations[toTrackKey(track.id)]
          ));
          // Update cover if needed and not custom
          if (playlist.image.includes('placeholder') && tracks.length > 0) {
               playlist.image = tracks[0].album.cover;
          }
          setStorage(data);
      }
  },

  renamePlaylist: (uuid: string, newTitle: string) => {
    // Deprecated wrapper, use updatePlaylist
    const data = getStorage();
    const playlist = data.playlists.find(p => p.uuid === uuid);
    if (playlist) {
      playlist.title = newTitle;
      setStorage(data);
    }
  },

  deletePlaylist: (uuid: string) => {
    const data = getStorage();
    data.playlists = data.playlists.filter(p => p.uuid !== uuid);
    setStorage(data);
  },

  addTrackToPlaylist: (playlistUuid: string, track: Track) => {
    const data = getStorage();
    const playlist = data.playlists.find(p => p.uuid === playlistUuid);
    const hydratedTrack = applyLyricsToTrack(
      track,
      data.fetchedLyrics[toTrackKey(track.id)],
      data.customLyrics[toTrackKey(track.id)],
      data.generatedRomanizations[toTrackKey(track.id)]
    );
    if (playlist) {
      if (!playlist.tracks) playlist.tracks = [];
      if (!playlist.tracks.some(t => t.id === track.id)) {
        playlist.tracks.push(hydratedTrack);
        if (playlist.image.includes('placeholder') && track.album.cover) {
            playlist.image = track.album.cover;
        }
        setStorage(data);
      }
    }
  },

  // --- Search History ---
  getHistory: (): string[] => {
    return getStorage().searchHistory;
  },

  addToHistory: (query: string) => {
    const data = getStorage();
    const filtered = data.searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());
    data.searchHistory = [query, ...filtered].slice(0, 10);
    setStorage(data);
  },

  // --- Recently Played ---
  getRecentlyPlayed: (): RecentlyPlayedItem[] => {
      const data = getStorage();
      return data.recentlyPlayed.map(item => applyLyricsToRecentItem(item, data.fetchedLyrics, data.customLyrics, data.generatedRomanizations));
  },

  addToRecentlyPlayed: (item: RecentlyPlayedItem) => {
      const data = getStorage();
      const hydratedItem = item.type === 'TRACK'
        ? {
            ...item,
            data: applyLyricsToTrack(
              item.data as Track,
              data.fetchedLyrics[toTrackKey((item.data as Track).id)],
              data.customLyrics[toTrackKey((item.data as Track).id)],
              data.generatedRomanizations[toTrackKey((item.data as Track).id)]
            )
          }
        : item;
      const filtered = data.recentlyPlayed.filter(i => {
          const existingId = (i.data as any).id || (i.data as any).uuid;
          const newId = (hydratedItem.data as any).id || (hydratedItem.data as any).uuid;
          return existingId !== newId;
      });
      data.recentlyPlayed = [hydratedItem, ...filtered].slice(0, 20); // Keep last 20
      setStorage(data);
  }
};
