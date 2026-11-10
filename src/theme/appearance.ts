import { Appearance } from 'react-native';

import type { Settings } from '@/domain/types';

/**
 * Applique le mode clair ou sombre choisi à toute l'app, composants natifs compris
 * (verre, interrupteurs, calendriers) ; `system` rend la main au réglage du téléphone.
 */
export function applyAppearance(appearance: Settings['appearance']): void {
  Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
}
