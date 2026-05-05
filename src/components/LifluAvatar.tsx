import React from 'react';

/* ─── Types ─────────────────────────────────────────────────────────── */
type Head       = 'round' | 'oval' | 'soft-square';
type Hair       = 'short' | 'long' | 'curly' | 'buzz' | 'ponytail' | 'bald';
type Eyes       = 'normal' | 'happy' | 'focused' | 'sleepy';
type Mouth      = 'smile' | 'neutral' | 'smirk';
type Outfit     = 'hoodie' | 'tshirt' | 'jacket';
type Skin       = 'light' | 'medium' | 'tan' | 'dark';
type BgStyle    = 'purple-gradient' | 'blue-gradient' | 'dark';

interface AvatarConfig {
  head: Head;
  hair: Hair;
  eyes: Eyes;
  mouth: Mouth;
  outfit: Outfit;
  skin: Skin;
  bg: BgStyle;
  hairColor: string;
  outfitColor: string;
}

interface Props {
  seed: string;
  size?: number;
  className?: string;
}

/* ─── Deterministic hash ─────────────────────────────────────────────── */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

function pick<T>(arr: T[], h: number, offset: number): T {
  return arr[Math.abs(hash(String(h + offset))) % arr.length];
}

function generateConfig(seed: string): AvatarConfig {
  const h = hash(seed);
  return {
    head:         pick<Head>(['round','oval','soft-square'], h, 1),
    hair:         pick<Hair>(['short','long','curly','buzz','ponytail','bald'], h, 2),
    eyes:         pick<Eyes>(['normal','happy','focused','sleepy'], h, 3),
    mouth:        pick<Mouth>(['smile','neutral','smirk'], h, 4),
    outfit:       pick<Outfit>(['hoodie','tshirt','jacket'], h, 5),
    skin:         pick<Skin>(['light','medium','tan','dark'], h, 6),
    bg:           pick<BgStyle>(['purple-gradient','blue-gradient','dark'], h, 7),
    hairColor:    pick(['#1a0a2e','#2d1b69','#4a2c8a','#8B5CF6','#f59e0b','#ef4444','#10b981','#1e293b'], h, 8),
    outfitColor:  pick(['#1e1b4b','#312e81','#1e3a5f','#0f172a','#1a2744','#2d1b69','#0c1a2e'], h, 9),
  };
}

/* ─── Skin tones ─────────────────────────────────────────────────────── */
const SKIN: Record<Skin, { face: string; shadow: string }> = {
  light:  { face: '#fde8d0', shadow: '#f5c9a0' },
  medium: { face: '#e8b88a', shadow: '#d4956a' },
  tan:    { face: '#c68642', shadow: '#a0622a' },
  dark:   { face: '#6b3a2a', shadow: '#4a2218' },
};

/* ─── Background ─────────────────────────────────────────────────────── */
function Background({ bg }: { bg: BgStyle }) {
  if (bg === 'purple-gradient') return (
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#4c1d95" />
        <stop offset="100%" stopColor="#0d0416" />
      </radialGradient>
    </defs>
  );
  if (bg === 'blue-gradient') return (
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
    </defs>
  );
  return (
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#1e1b2e" />
        <stop offset="100%" stopColor="#080612" />
      </radialGradient>
    </defs>
  );
}

/* ─── Head shape ─────────────────────────────────────────────────────── */
function HeadShape({ head, skin }: { head: Head; skin: Skin }) {
  const { face, shadow } = SKIN[skin];
  if (head === 'round') return (
    <>
      <ellipse cx="100" cy="115" rx="42" ry="10" fill={shadow} opacity="0.4" />
      <circle cx="100" cy="95" r="42" fill={face} />
    </>
  );
  if (head === 'oval') return (
    <>
      <ellipse cx="100" cy="118" rx="38" ry="8" fill={shadow} opacity="0.4" />
      <ellipse cx="100" cy="93" rx="36" ry="44" fill={face} />
    </>
  );
  // soft-square
  return (
    <>
      <ellipse cx="100" cy="116" rx="40" ry="9" fill={shadow} opacity="0.4" />
      <rect x="62" y="58" width="76" height="76" rx="22" ry="22" fill={face} />
    </>
  );
}

/* ─── Hair ───────────────────────────────────────────────────────────── */
function HairShape({ hair, color }: { hair: Hair; color: string }) {
  if (hair === 'bald') return null;
  if (hair === 'short') return (
    <ellipse cx="100" cy="72" rx="43" ry="26" fill={color} />
  );
  if (hair === 'buzz') return (
    <ellipse cx="100" cy="70" rx="43" ry="20" fill={color} opacity="0.9" />
  );
  if (hair === 'long') return (
    <>
      <ellipse cx="100" cy="70" rx="43" ry="26" fill={color} />
      <rect x="58" y="88" width="12" height="50" rx="6" fill={color} />
      <rect x="130" y="88" width="12" height="50" rx="6" fill={color} />
    </>
  );
  if (hair === 'curly') return (
    <>
      <ellipse cx="100" cy="68" rx="46" ry="28" fill={color} />
      <circle cx="62" cy="72" r="12" fill={color} />
      <circle cx="138" cy="72" r="12" fill={color} />
      <circle cx="80" cy="58" r="10" fill={color} />
      <circle cx="120" cy="58" r="10" fill={color} />
    </>
  );
  if (hair === 'ponytail') return (
    <>
      <ellipse cx="100" cy="70" rx="43" ry="26" fill={color} />
      <rect x="92" y="56" width="16" height="40" rx="8" fill={color} />
      <ellipse cx="100" cy="96" rx="8" ry="14" fill={color} />
    </>
  );
  return null;
}

/* ─── Eyes ───────────────────────────────────────────────────────────── */
function EyeShape({ eyes }: { eyes: Eyes }) {
  if (eyes === 'normal') return (
    <>
      <circle cx="85" cy="97" r="5" fill="#1a0a2e" />
      <circle cx="115" cy="97" r="5" fill="#1a0a2e" />
      <circle cx="87" cy="95" r="1.5" fill="white" />
      <circle cx="117" cy="95" r="1.5" fill="white" />
    </>
  );
  if (eyes === 'happy') return (
    <>
      <path d="M80 97 Q85 91 90 97" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M110 97 Q115 91 120 97" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  );
  if (eyes === 'focused') return (
    <>
      <circle cx="85" cy="97" r="5" fill="#1a0a2e" />
      <circle cx="115" cy="97" r="5" fill="#1a0a2e" />
      <circle cx="87" cy="95" r="1.5" fill="white" />
      <circle cx="117" cy="95" r="1.5" fill="white" />
      <line x1="79" y1="91" x2="91" y2="93" stroke="#1a0a2e" strokeWidth="2" strokeLinecap="round" />
      <line x1="109" y1="93" x2="121" y2="91" stroke="#1a0a2e" strokeWidth="2" strokeLinecap="round" />
    </>
  );
  // sleepy
  return (
    <>
      <path d="M80 97 Q85 100 90 97" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M110 97 Q115 100 120 97" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ─── Mouth ──────────────────────────────────────────────────────────── */
function MouthShape({ mouth }: { mouth: Mouth }) {
  if (mouth === 'smile') return (
    <path d="M88 110 Q100 120 112 110" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  );
  if (mouth === 'neutral') return (
    <line x1="90" y1="112" x2="110" y2="112" stroke="#1a0a2e" strokeWidth="2.5" strokeLinecap="round" />
  );
  // smirk
  return (
    <path d="M90 112 Q100 118 112 110" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  );
}

/* ─── Outfit ─────────────────────────────────────────────────────────── */
function OutfitShape({ outfit, color }: { outfit: Outfit; color: string }) {
  if (outfit === 'hoodie') return (
    <>
      <path d="M58 155 Q58 135 70 128 L100 138 L130 128 Q142 135 142 155 Z" fill={color} />
      <path d="M70 128 Q80 122 100 138 Q120 122 130 128" fill={color} opacity="0.6" />
      {/* hood strings */}
      <line x1="95" y1="138" x2="93" y2="148" stroke="#ffffff20" strokeWidth="1.5" />
      <line x1="105" y1="138" x2="107" y2="148" stroke="#ffffff20" strokeWidth="1.5" />
    </>
  );
  if (outfit === 'tshirt') return (
    <>
      <path d="M62 155 Q62 132 72 126 L85 132 L100 128 L115 132 L128 126 Q138 132 138 155 Z" fill={color} />
      <path d="M72 126 L62 118 L58 130 L72 134 Z" fill={color} />
      <path d="M128 126 L138 118 L142 130 L128 134 Z" fill={color} />
    </>
  );
  // jacket
  return (
    <>
      <path d="M60 155 Q60 132 72 126 L100 136 L128 126 Q140 132 140 155 Z" fill={color} />
      <path d="M72 126 L60 116 L56 132 L72 136 Z" fill={color} />
      <path d="M128 126 L140 116 L144 132 L128 136 Z" fill={color} />
      {/* lapels */}
      <path d="M100 136 L88 126 L80 136" fill="none" stroke="#ffffff15" strokeWidth="1.5" />
      <path d="M100 136 L112 126 L120 136" fill="none" stroke="#ffffff15" strokeWidth="1.5" />
    </>
  );
}

/* ─── Glow ring ──────────────────────────────────────────────────────── */
function GlowRing() {
  return (
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export const LifluAvatar: React.FC<Props> = ({ seed, size = 40, className }) => {
  const cfg = generateConfig(seed);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '50%', display: 'block' }}
    >
      <Background bg={cfg.bg} />
      <GlowRing />

      {/* Background circle */}
      <circle cx="100" cy="100" r="100" fill="url(#bg)" />

      {/* Subtle inner glow */}
      <circle cx="100" cy="60" r="70" fill="white" opacity="0.03" />

      {/* Outfit (behind head) */}
      <OutfitShape outfit={cfg.outfit} color={cfg.outfitColor} />

      {/* Hair back layer */}
      <HairShape hair={cfg.hair} color={cfg.hairColor} />

      {/* Head */}
      <HeadShape head={cfg.head} skin={cfg.skin} />

      {/* Eyes */}
      <EyeShape eyes={cfg.eyes} />

      {/* Nose — subtle */}
      <path d="M98 103 Q100 108 102 103" stroke={SKIN[cfg.skin].shadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Mouth */}
      <MouthShape mouth={cfg.mouth} />

      {/* Hair front layer (for styles that go over face) */}
      {cfg.hair === 'short' || cfg.hair === 'buzz' ? (
        <ellipse cx="100" cy="70" rx="43" ry="18" fill={cfg.hairColor} opacity="0.15" />
      ) : null}

      {/* Neon accent ring */}
      <circle cx="100" cy="100" r="97" fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0.3" filter="url(#glow)" />
    </svg>
  );
};

/* ─── Avatar picker (for onboarding/profile) ─────────────────────────── */
export const AvatarPicker: React.FC<{
  currentSeed: string;
  onSelect: (seed: string) => void;
}> = ({ currentSeed, onSelect }) => {
  const seeds = Array.from({ length: 12 }, (_, i) => `preset-${i}`);

  return (
    <div className="grid grid-cols-4 gap-3">
      {seeds.map(seed => (
        <button
          key={seed}
          onClick={() => onSelect(seed)}
          className={`rounded-full overflow-hidden transition-all ${
            seed === currentSeed
              ? 'ring-2 ring-accent-purple ring-offset-2 ring-offset-[#0b0416] scale-110'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <LifluAvatar seed={seed} size={56} />
        </button>
      ))}
    </div>
  );
};
