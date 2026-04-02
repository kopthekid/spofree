import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import kroman from 'kroman';
import { pinyin } from 'pinyin-pro';
import { LyricsLanguage } from '../types';

let kuroshiroInstance: Kuroshiro | null = null;
let kuroshiroInitPromise: Promise<Kuroshiro> | null = null;

const hasHangul = (text: string) => /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(text);
const hasKanaOrKanji = (text: string) => /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
const hasHanzi = (text: string) => /[\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
const hasKana = (text: string) => /[\u3040-\u30ff]/.test(text);

const detectLyricsLanguage = (lyrics: string): LyricsLanguage | null => {
  if (hasHangul(lyrics)) return 'KOREAN';
  if (hasKana(lyrics)) return 'JAPANESE';
  if (hasHanzi(lyrics)) return 'CHINESE';
  return null;
};

const getJapaneseRomanizer = async () => {
  if (kuroshiroInstance) return kuroshiroInstance;
  if (kuroshiroInitPromise) return kuroshiroInitPromise;

  const dictPath = `${import.meta.env.BASE_URL}kuromoji/dict/`;
  const instance = new Kuroshiro();

  kuroshiroInitPromise = instance
    .init(new KuromojiAnalyzer({ dictPath }))
    .then(() => {
      kuroshiroInstance = instance;
      return instance;
    })
    .finally(() => {
      kuroshiroInitPromise = null;
    });

  return kuroshiroInitPromise;
};

const romanizeKorean = (lyrics: string): string => {
  return lyrics
    .split(/\r?\n/)
    .map(line => kroman.parse(line).replace(/-/g, ''))
    .join('\n');
};

const romanizeChinese = (lyrics: string): string => {
  return lyrics
    .split(/\r?\n/)
    .map(line => pinyin(line, { toneType: 'none' }))
    .join('\n');
};

const romanizeJapanese = async (lyrics: string): Promise<string> => {
  const kuroshiro = await getJapaneseRomanizer();
  const lines = lyrics.split(/\r?\n/);
  const romanizedLines = await Promise.all(
    lines.map(line => kuroshiro.convert(line, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' }))
  );
  return romanizedLines.join('\n');
};

export const generateRomanization = async (
  lyrics: string,
  preferredLanguage?: LyricsLanguage
): Promise<{ romanizedLyrics: string; detectedLanguage: LyricsLanguage | null } | null> => {
  const trimmedLyrics = lyrics.trim();
  if (!trimmedLyrics) return null;

  const detectedLanguage = preferredLanguage && preferredLanguage !== 'OTHER'
    ? preferredLanguage
    : detectLyricsLanguage(trimmedLyrics);

  if (!detectedLanguage || detectedLanguage === 'OTHER') {
    return null;
  }

  let romanizedLyrics = '';

  if (detectedLanguage === 'KOREAN') {
    romanizedLyrics = romanizeKorean(trimmedLyrics);
  } else if (detectedLanguage === 'CHINESE') {
    romanizedLyrics = romanizeChinese(trimmedLyrics);
  } else if (detectedLanguage === 'JAPANESE') {
    romanizedLyrics = await romanizeJapanese(trimmedLyrics);
  }

  const cleanedRomanization = romanizedLyrics.trim();
  if (!cleanedRomanization || cleanedRomanization === trimmedLyrics) {
    return null;
  }

  return {
    romanizedLyrics: cleanedRomanization,
    detectedLanguage
  };
};

export const canAutoRomanize = (lyrics: string, preferredLanguage?: LyricsLanguage): boolean => {
  const detectedLanguage = preferredLanguage && preferredLanguage !== 'OTHER'
    ? preferredLanguage
    : detectLyricsLanguage(lyrics);

  return detectedLanguage === 'KOREAN' || detectedLanguage === 'JAPANESE' || detectedLanguage === 'CHINESE';
};
