import { Check, Repeat } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { daysBetween } from '@/domain/dates';
import type { TrackedContact } from '@/domain/types';
import { urgency, urgencyLevel } from '@/domain/urgency';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

import { Avatar } from './avatar';

type Props = {
  contact: TrackedContact;
  now: Date;
  onPress: () => void;
  /** Glisser vers la gauche : « J'ai pris des nouvelles » (US-08 CA5). */
  onMarkDone: () => void;
};

const ACTION_WIDTH = 128;

/** Ligne de l'accueil : avatar, nom, fréquence et délai depuis le dernier échange (US-08 CA4). */
export function ContactRow({ contact, now, onPress, onMarkDone }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const swipeable = useRef<SwipeableMethods>(null);

  const days = daysBetween(contact.lastContactAt, now);
  const level = urgencyLevel(urgency(contact, now));
  const delayColor = level === 'very_late' ? colors.red : level === 'late' ? colors.amber : colors.textSecondary;
  const ringColor = level === 'ok' ? undefined : delayColor;
  const frequency = t(`frequency.${contact.frequencyDays}`);

  const renderAction = () => (
    <Pressable
      onPress={() => {
        swipeable.current?.close();
        onMarkDone();
      }}
      style={[styles.action, { backgroundColor: colors.green }]}
      accessibilityRole="button">
      <Check color="#FFFFFF" size={26} strokeWidth={2.5} />
      <Text style={[Type.caption, styles.actionText]}>{t('home.markDone')}</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={1.5}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={renderAction}
      onSwipeableOpen={() => {
        swipeable.current?.close();
        onMarkDone();
      }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.fill : colors.background }]}
        accessibilityRole="button"
        accessibilityLabel={`${contact.displayName}, ${frequency}, ${t('home.daysAgoA11y', { count: days })}`}
        accessibilityActions={[{ name: 'markDone', label: t('home.markDone') }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'markDone' && onMarkDone()}>
        <Avatar id={contact.id} name={contact.displayName} ringColor={ringColor} />
        <View style={[styles.content, { borderBottomColor: colors.separator }]}>
          <View style={styles.texts}>
            <Text style={[Type.name, { color: colors.text }]} numberOfLines={1}>
              {contact.displayName}
            </Text>
            <View style={styles.frequency}>
              <Repeat color={colors.textSecondary} size={15} />
              <Text style={[Type.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
                {frequency}
              </Text>
            </View>
          </View>
          <View style={styles.trailing}>
            <Text style={[Type.secondary, { color: delayColor, fontWeight: level === 'ok' ? '400' : '700' }]}>
              {t('home.daysAgo', { count: days })}
            </Text>
            {level === 'very_late' && (
              <View style={[styles.chip, { backgroundColor: colors.redSoft }]}>
                <Text style={[Type.caption, { color: colors.redText }]}>{t('home.late')}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, gap: 14 },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 84,
  },
  texts: { flex: 1, gap: 4 },
  frequency: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trailing: { alignItems: 'flex-end', alignSelf: 'flex-start', gap: 6, paddingTop: 2, marginLeft: 8 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  action: { width: ACTION_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  actionText: { color: '#FFFFFF', textAlign: 'center' },
});
