import React, { useState } from 'react';
import { Languages, Trash2, X } from 'lucide-react';
import { Button } from './Button';
import { LyricsLanguage, Track } from '../types';
import { storageService } from '../services/storageService';

interface LyricsEditModalProps {
  track: Track;
  onClose: () => void;
  onSave: (
    trackId: string | number,
    payload: { lyrics: string; romanizedLyrics?: string; lyricsLanguage?: LyricsLanguage }
  ) => void;
  onRemove: (trackId: string | number) => void;
}

const languageOptions: { value: LyricsLanguage; label: string; hint: string }[] = [
  { value: 'KOREAN', label: 'Korean', hint: 'Use romanization for Hangul lyrics.' },
  { value: 'JAPANESE', label: 'Japanese', hint: 'Use romanization for kana or kanji lyrics.' },
  { value: 'CHINESE', label: 'Chinese', hint: 'Use romanization for hanzi lyrics.' },
  { value: 'OTHER', label: 'Other', hint: 'Keep a plain alternate reading or pronunciation.' }
];

export const LyricsEditModal: React.FC<LyricsEditModalProps> = ({
  track,
  onClose,
  onSave,
  onRemove
}) => {
  const savedLyrics = storageService.getCustomLyrics(track.id);
  const [lyrics, setLyrics] = useState(savedLyrics?.lyrics || track.lyrics || '');
  const [romanizedLyrics, setRomanizedLyrics] = useState(savedLyrics?.romanizedLyrics || track.romanizedLyrics || '');
  const [lyricsLanguage, setLyricsLanguage] = useState<LyricsLanguage>(savedLyrics?.lyricsLanguage || track.lyricsLanguage || 'KOREAN');

  const hasSavedLyrics = Boolean(savedLyrics?.lyrics?.trim());
  const selectedLanguage = languageOptions.find(option => option.value === lyricsLanguage);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#282828] bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#282828] bg-[#181818] p-6">
          <div>
            <h2 className="text-xl font-bold text-white">Custom Lyrics</h2>
            <p className="mt-1 text-sm text-[#b3b3b3]">
              {track.title} • {track.artist.name}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#b3b3b3] transition-colors hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6 md:p-8">
          <div className="grid gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.25em] text-[#b3b3b3]">
                Original Lyrics
              </label>
              <textarea
                value={lyrics}
                onChange={(event) => setLyrics(event.target.value)}
                placeholder="Paste the original lyrics here"
                className="h-64 w-full resize-none rounded-xl border border-[#3e3e3e] bg-[#181818] p-4 text-sm text-white placeholder:text-[#6e6e6e] focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Languages size={18} className="text-[#b3b3b3]" />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.25em] text-[#b3b3b3]">
                    Romanization
                  </label>
                  <p className="mt-1 text-sm text-[#b3b3b3]">
                    Optional for Korean, Japanese, or Chinese lyrics.
                  </p>
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {languageOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setLyricsLanguage(option.value)}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      lyricsLanguage === option.value
                        ? 'border-green-500 bg-green-500/10 text-white'
                        : 'border-white/10 bg-[#181818] text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="mt-1 text-xs text-white/50">{option.hint}</div>
                  </button>
                ))}
              </div>

              <textarea
                value={romanizedLyrics}
                onChange={(event) => setRomanizedLyrics(event.target.value)}
                placeholder={`Paste ${selectedLanguage?.label.toLowerCase() || 'romanized'} lyrics here`}
                className="h-64 w-full resize-none rounded-xl border border-[#3e3e3e] bg-[#181818] p-4 text-sm text-white placeholder:text-[#6e6e6e] focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#282828] bg-[#181818] p-6">
          <button
            onClick={() => {
              onRemove(track.id);
              onClose();
            }}
            disabled={!hasSavedLyrics}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-red-400/40"
          >
            <Trash2 size={16} />
            Remove Custom Lyrics
          </button>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(track.id, {
                  lyrics,
                  romanizedLyrics,
                  lyricsLanguage: romanizedLyrics.trim() ? lyricsLanguage : undefined
                });
                onClose();
              }}
              disabled={!lyrics.trim()}
            >
              Save Lyrics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
