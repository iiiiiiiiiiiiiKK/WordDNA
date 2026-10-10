import { useEffect, useState, type MouseEvent } from 'react';
import { Icon } from './Icon';

interface SpeakButtonProps {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
}

/**
 * 发音按钮：零第三方依赖，用浏览器内置 Web Speech API 朗读英文。
 *
 * 准确率优化：默认 voice 常常是机器味最重的那个，这里主动挑选系统里
 * 质量最好的英语嗓音（优先「增强/高级/自然」类，其次常见的优质嗓音，
 * 再其次 en-US），并稍微放慢语速，听感明显更自然。
 */
let cachedVoice: SpeechSynthesisVoice | null = null;

// 按听感排序的优质英语嗓音关键词（各平台命名不同，命中即用）
const PREFERRED = [
  'enhanced',
  'premium',
  'natural',
  'siri',
  'samantha',
  'alex',
  'karen',
  'daniel',
  'aria',
  'jenny',
  'zira',
  'google us english',
  'google uk english',
];

function pickBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const wanted = lang.toLowerCase().replace('_', '-');
  const shortLang = wanted.split('-')[0]; // 'en'
  // 先筛出同语种的嗓音
  const sameLang = voices.filter((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === wanted || l.startsWith(shortLang + '-') || l === shortLang;
  });
  const pool = sameLang.length ? sameLang : voices;

  for (const key of PREFERRED) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(key));
    if (hit) return hit;
  }
  // 退而求其次：精确匹配目标语种
  return (
    pool.find((v) => v.lang.toLowerCase().replace('_', '-') === wanted) ?? pool[0] ?? null
  );
}

export function SpeakButton({ text, lang = 'en-US', label, className }: SpeakButtonProps) {
  const [supported, setSupported] = useState(false);
  const [, forceReady] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') return;
    setSupported(true);

    // iOS/Safari 的嗓音列表是异步加载的，需要监听 voiceschanged 再去挑
    const load = () => {
      cachedVoice = pickBestVoice(lang);
      forceReady((n) => n + 1);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, [lang]);

  if (!supported) return null;

  const speak = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      // 稍微放慢，更适合学习，也减轻机器感
      u.rate = 0.88;
      u.pitch = 1;
      u.volume = 1;
      if (!cachedVoice) cachedVoice = pickBestVoice(lang);
      if (cachedVoice) u.voice = cachedVoice;
      window.speechSynthesis.speak(u);
    } catch {
      /* 不支持时静默失败，不影响其它交互 */
    }
  };

  return (
    <button
      onClick={speak}
      aria-label={`朗读 ${text}`}
      className={
        'inline-flex shrink-0 items-center gap-1 border-2 border-ink px-2 py-0.5 text-xs font-semibold text-text transition-colors hover:bg-accent/20 ' +
        (className ?? '')
      }
    >
      <Icon name="play" size={12} />
      {label ?? '发音'}
    </button>
  );
}
