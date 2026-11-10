import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { isoWeekday } from '@/domain/dates';
import type { DayState } from '@/domain/streak';
import { useColors } from '@/theme/use-colors';

/** Initiale d'un jour ISO (1 = lundi) dans la langue : L M M J V S D / M T W T F S S. */
function dayInitial(day: number, language: string): string {
  // Le 4 janvier 2026 est un dimanche : 4 + n tombe sur le n-ième jour ISO.
  return new Intl.DateTimeFormat(language, { weekday: 'narrow' }).format(new Date(2026, 0, 4 + day)).toLocaleUpperCase(language);
}

type Props = {
  week: readonly DayState[];
  today: Date;
  language: string;
  /** Couleur des jours sans rappel ni échange ; gris par défaut, blanc sur une carte grise. */
  emptyColor?: string;
};

/**
 * Jours de la semaine en cours (US-19 CA4) : pastille orange cochée (échange noté), orange pâle
 * (rappel envoyé sans échange) ou grise (rien, ou jour à venir). L'initiale du jour en cours est en gras.
 */
export function WeekDots({ week, today, language, emptyColor }: Props) {
  const colors = useColors();
  const current = isoWeekday(today);
  const background = { done: colors.accent, missed: colors.accentMuted, none: emptyColor ?? colors.fill };
  return (
    <View style={styles.row}>
      {week.map((state, i) => (
        <View
          key={i}
          style={styles.day}
          accessible
          accessibilityLabel={`${dayInitial(i + 1, language)} ${state}`}>
          <Text
            style={[
              styles.initial,
              { color: i + 1 === current ? colors.text : colors.textSecondary, fontWeight: i + 1 === current ? '700' : '500' },
            ]}>
            {dayInitial(i + 1, language)}
          </Text>
          <View style={[styles.dot, { backgroundColor: background[state] }]}>
            {state === 'done' && <Check color={colors.onAccent} size={18} strokeWidth={3} />}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 8 },
  initial: { fontSize: 13 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
