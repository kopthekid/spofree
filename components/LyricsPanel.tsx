import React, { useEffect, useState } from 'react';
import { Languages, Pencil } from 'lucide-react';
import { Track } from '../types';

type LyricsDisplayMode = 'ORIGINAL' | 'DUAL' | 'ROMANIZED';

interface LyricsPanelProps {
  track: Track | null;
  accentColor: string;
  onEditLyrics?: (track: Track) => void;
  variant?: 'sidebar' | 'fullscreen';
}

const splitLyrics = (text?: string) =>
  (text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

const languageLabel: Record<string, string> = {
  KOREAN: 'Korean',
  JAPANESE: 'Japanese',
  CHINESE: 'Chinese',
  OTHER: 'Other'
};

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  track,
  accentColor,
  onEditLyrics,
  variant = 'sidebar'
}) => {
  const [displayMode, setDisplayMode] = useState<LyricsDisplayMode>('ORIGINAL');

  useEffect(() => {
    setDisplayMode('ORIGINAL');
  }, [track?.id]);

  if (!track) {
    return <div className="text-[#b3b3b3]">Play a song to see lyrics</div>;
  }

  const lyrics = track.lyrics?.trim() || '';
  const romanizedLyrics = track.romanizedLyrics?.trim() || '';
  const hasLyrics = Boolean(lyrics);
  const hasRomanizedLyrics = Boolean(romanizedLyrics);
  const originalLines = splitLyrics(lyrics);
  const romanizedLines = splitLyrics(romanizedLyrics);
  const canPairLines =
    hasLyrics &&
    hasRomanizedLyrics &&
    originalLines.length === romanizedLines.length &&
    originalLines.length > 0;

  const titleClass = variant === 'fullscreen' ? 'text-3xl' : 'text-xl';
  const artistClass = variant === 'fullscreen' ? 'text-xl text-white/70' : 'text-sm text-[#b3b3b3]';
  const bodyClass =
    variant === 'fullscreen'
      ? 'w-full max-w-3xl space-y-8 text-center'
      : 'w-full max-w-md space-y-6 text-center';
  const lineClass = variant === 'fullscreen' ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl';
  const subLineClass = variant === 'fullscreen' ? 'text-lg md:text-xl' : 'text-sm md:text-base';

  const renderOriginalLyrics = () => (
    <div className="space-y-5">
      {originalLines.map((line, index) => (
        <p
          key={`original-${index}`}
          className={`${lineClass} font-bold text-white leading-relaxed`}
          style={{ textShadow: `0 0 24px ${accentColor}30` }}
        >
          {line}
        </p>
      ))}
    </div>
  );

  const renderRomanizedLyrics = () => (
    <div className="space-y-4">
      {romanizedLines.map((line, index) => (
        <p key={`romanized-${index}`} className={`${lineClass} font-semibold text-white/80 leading-relaxed italic`}>
          {line}
        </p>
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center ${variant === 'fullscreen' ? 'min-h-[calc(100vh-100px)] p-8' : 'w-full'}`}>
      <div className={bodyClass}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <h1 className={`${titleClass} font-bold text-white`}>{track.title}</h1>
            <h2 className={artistClass}>{track.artist.name}</h2>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {track.lyricsLanguage && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                <Languages size={12} />
                {languageLabel[track.lyricsLanguage] || 'Lyrics'}
              </span>
            )}
            {onEditLyrics && (
              <button
                onClick={() => onEditLyrics(track)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Pencil size={12} />
                {hasLyrics ? 'Edit Lyrics' : 'Add Lyrics'}
              </button>
            )}
          </div>
        </div>

        {!hasLyrics ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-white/60">
            <p className="text-xl font-bold text-white">(Lyrics not available yet)</p>
            <p className="mt-4 leading-relaxed">
              Add your own lyrics for this track and optionally include romanization for Korean, Japanese, or Chinese.
            </p>
          </div>
        ) : (
          <>
            {hasRomanizedLyrics && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setDisplayMode('ORIGINAL')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                    displayMode === 'ORIGINAL' ? 'text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  style={displayMode === 'ORIGINAL' ? { backgroundColor: accentColor } : undefined}
                >
                  Original
                </button>
                <button
                  onClick={() => setDisplayMode('DUAL')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                    displayMode === 'DUAL' ? 'text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  style={displayMode === 'DUAL' ? { backgroundColor: accentColor } : undefined}
                >
                  Both
                </button>
                <button
                  onClick={() => setDisplayMode('ROMANIZED')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                    displayMode === 'ROMANIZED' ? 'text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  style={displayMode === 'ROMANIZED' ? { backgroundColor: accentColor } : undefined}
                >
                  Romanized
                </button>
              </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-black/20 px-6 py-8">
              {displayMode === 'ORIGINAL' && renderOriginalLyrics()}

              {displayMode === 'ROMANIZED' && renderRomanizedLyrics()}

              {displayMode === 'DUAL' && (
                canPairLines ? (
                  <div className="space-y-8">
                    {originalLines.map((line, index) => (
                      <div key={`pair-${index}`} className="space-y-2">
                        <p
                          className={`${lineClass} font-bold text-white leading-relaxed`}
                          style={{ textShadow: `0 0 24px ${accentColor}30` }}
                        >
                          {line}
                        </p>
                        <p className={`${subLineClass} font-medium italic text-white/70 leading-relaxed`}>
                          {romanizedLines[index]}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div>
                      <div className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-white/40">Original</div>
                      {renderOriginalLyrics()}
                    </div>
                    <div>
                      <div className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-white/40">Romanized</div>
                      {renderRomanizedLyrics()}
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
