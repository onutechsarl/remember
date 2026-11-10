import type { ReactNode, Ref } from 'react';
import { useImperativeHandle } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type SwipeDirection = 'left' | 'right';

export type SwipeCardHandle = {
  /** Fait partir la carte comme un glissement (boutons « Non » / « On s'est parlé »). */
  fling: (direction: SwipeDirection) => void;
};

type Props = {
  onSwiped: (direction: SwipeDirection) => void;
  /** Contenu affiché par-dessus la carte pendant le glissement, selon le sens. */
  renderOverlay?: (direction: SwipeDirection) => ReactNode;
  children: ReactNode;
  ref?: Ref<SwipeCardHandle>;
};

/** Distance ou vitesse à partir de laquelle un glissement compte comme une réponse. */
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 800;

/**
 * Carte qui se glisse à droite ou à gauche (bilan hebdomadaire, US-14 CA3).
 * Le geste et l'animation tournent sur le thread de l'interface ; la réponse est transmise ensuite.
 * Une nouvelle carte doit être montée avec une nouvelle `key`. Les valeurs partagées passent par
 * `get()` / `set()` (Reanimated 4), compatibles avec le React Compiler.
 */
export function SwipeCard({ onSwiped, renderOverlay, children, ref }: Props) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);

  const leave = (direction: SwipeDirection) => {
    'worklet';
    x.set(withTiming((direction === 'right' ? 1 : -1) * width * 1.3, { duration: 220 }, (finished) => {
      if (finished) scheduleOnRN(onSwiped, direction);
    }));
  };

  useImperativeHandle(ref, () => ({ fling: (direction) => leave(direction) }));

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-20, 20],
    onUpdate: (e) => {
      'worklet';
      x.set(e.translationX);
    },
    onDeactivate: (e) => {
      'worklet';
      if (Math.abs(e.translationX) > SWIPE_DISTANCE || Math.abs(e.velocityX) > SWIPE_VELOCITY) {
        leave(e.translationX > 0 ? 'right' : 'left');
      } else {
        x.set(withSpring(0));
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { rotate: `${interpolate(x.get(), [-width, width], [-12, 12])}deg` }],
  }));
  const rightOverlay = useAnimatedStyle(() => ({ opacity: interpolate(x.get(), [0, SWIPE_DISTANCE], [0, 1], 'clamp') }));
  const leftOverlay = useAnimatedStyle(() => ({ opacity: interpolate(x.get(), [-SWIPE_DISTANCE, 0], [1, 0], 'clamp') }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={cardStyle}>
        {children}
        {renderOverlay && (
          <>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, rightOverlay]}>
              {renderOverlay('right')}
            </Animated.View>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, leftOverlay]}>
              {renderOverlay('left')}
            </Animated.View>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
