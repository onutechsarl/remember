import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

/**
 * Mémo, le panda roux mascotte de Remember (spécifications, US-19 CA11 ; maquettes, « Mascotte »),
 * dessiné en vectoriel avec des dégradés pour l'effet de volume. Ses couleurs ne changent pas
 * avec le thème (maquettes, « Thème sombre »).
 *
 * - `happy` : content (écran vide, semaine réussie) ;
 * - `party` : en fête (bilan terminé, paliers de série) ;
 * - `sad` : triste (accès refusé, erreur) ;
 * - `grumpy` : fâché, avec humour (widget quand rien n'est noté dans la semaine).
 */
export type MemoMood = 'happy' | 'party' | 'sad' | 'grumpy';

const INK = '#2A130B';

function Eyes({ mood }: { mood: MemoMood }) {
  switch (mood) {
    case 'happy':
      return (
        <>
          <Circle cx={80} cy={106} r={10.5} fill={INK} />
          <Circle cx={120} cy={106} r={10.5} fill={INK} />
          <Circle cx={83.5} cy={101.5} r={3.6} fill="#fff" />
          <Circle cx={123.5} cy={101.5} r={3.6} fill="#fff" />
          <Circle cx={77} cy={110} r={1.6} fill="#fff" opacity={0.8} />
          <Circle cx={117} cy={110} r={1.6} fill="#fff" opacity={0.8} />
        </>
      );
    case 'party':
      return (
        <>
          <Path d="M70 108 Q80 97 90 108" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M110 108 Q120 97 130 108" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      );
    case 'sad':
      return (
        <>
          <Circle cx={80} cy={109} r={9} fill={INK} />
          <Circle cx={120} cy={109} r={9} fill={INK} />
          <Circle cx={82.5} cy={105.5} r={3} fill="#fff" />
          <Circle cx={122.5} cy={105.5} r={3} fill="#fff" />
          <Path d="M68 99 L88 92" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M132 99 L112 92" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </>
      );
    case 'grumpy':
      return (
        <>
          <Path d="M66 92 L90 101" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <Path d="M134 92 L110 101" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <Path d="M71 108 Q80 104 89 108 L88 111 Q80 113 72 111 Z" fill={INK} />
          <Path d="M111 108 Q120 104 129 108 L128 111 Q120 113 112 111 Z" fill={INK} />
        </>
      );
  }
}

function Mouth({ mood }: { mood: MemoMood }) {
  switch (mood) {
    case 'happy':
      return (
        <Path
          d="M92 141 Q96 146 100 141 Q104 146 108 141"
          stroke={INK}
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'party':
      return (
        <>
          <Path d="M90 139 Q100 139 110 139 Q108 152 100 153 Q92 152 90 139 Z" fill="#8E2A1B" />
          <Path d="M94 148 Q100 145 106 148 Q103 153 100 153 Q97 153 94 148 Z" fill="#FF8A8A" />
        </>
      );
    case 'sad':
      return <Path d="M93 146 Q100 140 107 146" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
    case 'grumpy':
      return <Path d="M92 147 Q100 140 108 147" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />;
  }
}

type Props = { mood?: MemoMood; size?: number; accessibilityLabel?: string };

export function Memo({ mood = 'happy', size = 160, accessibilityLabel }: Props) {
  // Identifiants de dégradés propres à chaque instance (plusieurs Mémo peuvent être à l'écran).
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}>
      <Defs>
        <RadialGradient id={id('head')} cx="38%" cy="28%" r="75%">
          <Stop offset="0" stopColor="#FFB775" />
          <Stop offset="0.45" stopColor="#F47B26" />
          <Stop offset="1" stopColor="#C24A16" />
        </RadialGradient>
        <RadialGradient id={id('ear')} cx="45%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F3E3D3" />
        </RadialGradient>
        <RadialGradient id={id('earIn')} cx="50%" cy="40%" r="65%">
          <Stop offset="0" stopColor="#8E3A1A" />
          <Stop offset="1" stopColor="#4A1B0C" />
        </RadialGradient>
        <RadialGradient id={id('cream')} cx="45%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F6E6D6" />
        </RadialGradient>
      </Defs>

      <Ellipse cx={100} cy={184} rx={60} ry={7} fill="#000" opacity={0.08} />
      <G transform="rotate(-24 56 62)">
        <Ellipse cx={56} cy={62} rx={27} ry={33} fill={url('ear')} />
        <Ellipse cx={57} cy={68} rx={16} ry={22} fill={url('earIn')} />
      </G>
      <G transform="rotate(24 144 62)">
        <Ellipse cx={144} cy={62} rx={27} ry={33} fill={url('ear')} />
        <Ellipse cx={143} cy={68} rx={16} ry={22} fill={url('earIn')} />
      </G>
      <Ellipse cx={100} cy={114} rx={74} ry={64} fill={url('head')} />
      <Ellipse cx={86} cy={76} rx={26} ry={12} fill="#fff" opacity={0.22} />
      <Ellipse cx={78} cy={88} rx={12} ry={7} fill={url('cream')} />
      <Ellipse cx={122} cy={88} rx={12} ry={7} fill={url('cream')} />
      <Ellipse cx={52} cy={132} rx={27} ry={21} fill={url('cream')} />
      <Ellipse cx={148} cy={132} rx={27} ry={21} fill={url('cream')} />
      <Ellipse cx={100} cy={140} rx={31} ry={25} fill={url('cream')} />
      <Path d="M79 118 Q73 136 66 152" stroke="#9A3D18" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
      <Path d="M121 118 Q127 136 134 152" stroke="#9A3D18" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
      <Ellipse cx={66} cy={134} rx={8} ry={5} fill="#FF7A7A" opacity={0.35} />
      <Ellipse cx={134} cy={134} rx={8} ry={5} fill="#FF7A7A" opacity={0.35} />
      <Eyes mood={mood} />
      <Path d="M89 124 Q100 119 111 124 Q107 134 100 136 Q93 134 89 124 Z" fill={INK} />
      <Ellipse cx={96} cy={124} rx={4} ry={2} fill="#fff" opacity={0.55} />
      <Mouth mood={mood} />
    </Svg>
  );
}
