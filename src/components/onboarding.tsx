import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Lock } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS } from '@/theme/radius';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

import { Avatar } from './avatar';
import { PrimaryButton, TextButton } from './buttons';
import { SelectionMark } from './form';
import { Memo } from './memo';

/** Nombre d'écrans du premier lancement (US-01 CA1 : 3 au maximum). */
export const ONBOARDING_PAGES = 3;

type PageProps = {
  page: number;
  illustration: ReactNode;
  title: string;
  body: string;
  action: { label: string; onPress: () => void; disabled?: boolean };
  /** Action secondaire sous le bouton (« Plus tard »). */
  secondary?: { label: string; onPress: () => void };
  /** « Passer », en haut à droite (US-01 CA1). */
  onSkip?: () => void;
};

/** Mise en page d'un écran du premier lancement : illustration, titre, texte, points, bouton. */
export function OnboardingPage({ page, illustration, title, body, action, secondary, onSkip }: PageProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.top}>{onSkip && <TextButton label={t('onboarding.skip')} onPress={onSkip} />}</View>
      <View style={styles.illustration}>{illustration}</View>
      <View style={styles.texts}>
        <Text style={[Type.largeTitle, styles.title, { color: colors.text }]} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[Type.body, styles.body, { color: colors.textSecondary }]}>{body}</Text>
      </View>
      <Dots page={page} />
      <View style={styles.actions}>
        <PrimaryButton block label={action.label} onPress={action.onPress} disabled={action.disabled} />
        <View style={styles.secondary}>
          {secondary && <TextButton label={secondary.label} onPress={secondary.onPress} />}
        </View>
      </View>
    </View>
  );
}

function Dots({ page }: { page: number }) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={t('onboarding.page', { current: page + 1, total: ONBOARDING_PAGES })}>
      {Array.from({ length: ONBOARDING_PAGES }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === page && styles.dotActive, { backgroundColor: i === page ? colors.accent : colors.separator }]}
        />
      ))}
    </View>
  );
}

/** Écran 1 : Mémo entouré des proches, et une bulle « Ça fait longtemps ! ». */
export function WelcomeIllustration() {
  const { t } = useTranslation();
  const colors = useColors();
  const around = [
    { id: 'marie', style: { top: 18, left: 18 } },
    { id: 'paul', style: { top: 46, right: 8 } },
    { id: 'awa', style: { top: 168, left: 0 } },
    { id: 'maman', style: { top: 188, right: 0 } },
    { id: 'jonas', style: { bottom: 0, left: 122 } },
  ] as const;
  return (
    <View style={styles.orbit} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.ring, styles.ringOuter, { backgroundColor: colors.fill, opacity: 0.55 }]} />
      <View style={[styles.ring, styles.ringInner, { backgroundColor: colors.fill }]} />
      <View style={styles.memo}>
        <Memo mood="happy" size={150} />
      </View>
      {around.map((p) => (
        <View key={p.id} style={[styles.orbitAvatar, p.style]}>
          <Avatar id={p.id} name={t(`onboarding.sampleNames.${p.id}`)} size={56} />
        </View>
      ))}
      <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
        <Text style={[Type.secondary, { color: colors.text }]}>{t('onboarding.bubble')}</Text>
      </View>
    </View>
  );
}

/** Écran 2 : une sélection de contacts, et la promesse que les contacts restent sur le téléphone. */
export function ContactsIllustration() {
  const { t } = useTranslation();
  const colors = useColors();
  const people = [
    { id: 'marie', phone: '+237 6 99 12 34 56', checked: true },
    { id: 'paul', phone: '+237 6 55 44 33 22', checked: true },
    { id: 'awa', phone: '+33 6 12 34 56 78', checked: false },
  ] as const;
  return (
    <View style={[styles.panel, { backgroundColor: colors.fill }]} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.list, { backgroundColor: colors.surface }]}>
        {people.map((p, i) => {
          const name = t(`onboarding.sampleNames.${p.id}`);
          return (
            <View
              key={p.id}
              style={[
                styles.listRow,
                i < people.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
              ]}>
              <SelectionMark checked={p.checked} />
              <Avatar id={p.id} name={name} size={44} />
              <View style={styles.listTexts}>
                <Text style={[Type.name, { color: colors.text }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[Type.secondary, { color: colors.textSecondary }]}>{p.phone}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.privacy}>
        <Lock color={colors.accent} size={16} strokeWidth={2.4} />
        <Text style={[Type.secondary, styles.privacyText, { color: colors.textSecondary }]}>{t('onboarding.contactsPrivacy')}</Text>
      </View>
    </View>
  );
}

/** Écran 3 : un exemple de rappel sur l'écran verrouillé (US-03 CA1). */
export function NotificationIllustration() {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <View style={styles.panelShadow} accessible={false} importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={['#FFCDA6', '#FB9A5C', '#F0718A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.lockScreen}>
        <Text style={styles.clock} allowFontScaling={false}>
          18:00
        </Text>
        <View style={styles.notification}>
          <View style={styles.appIcon}>
            <LinearGradient colors={['#FFB46E', '#F76B15']} style={StyleSheet.absoluteFill} />
            <Memo mood="happy" size={40} />
          </View>
          <View style={styles.notificationTexts}>
            <View style={styles.notificationHead}>
              <Text style={[Type.name, styles.notificationTitle]} numberOfLines={1}>
                {t('onboarding.sampleNames.marie')}
              </Text>
              <Text style={[Type.caption, styles.notificationTime]}>{t('onboarding.sampleNow')}</Text>
            </View>
            <Text style={[Type.secondary, styles.notificationBody]}>{t('onboarding.sampleBody')}</Text>
          </View>
        </View>
        <View style={[styles.bell, { backgroundColor: colors.accent }]}>
          <Bell color={colors.onAccent} fill={colors.onAccent} size={28} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  top: { height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  illustration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texts: { gap: 12, paddingVertical: 16 },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  actions: { gap: 4 },
  secondary: { minHeight: 44, justifyContent: 'center' },

  orbit: { width: 300, height: 300 },
  ring: { position: 'absolute', borderRadius: 999 },
  ringOuter: { top: 0, left: 0, width: 300, height: 300 },
  ringInner: { top: 50, left: 50, width: 200, height: 200 },
  memo: { position: 'absolute', top: 75, left: 75 },
  orbitAvatar: { position: 'absolute', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)', borderRadius: 28 },
  bubble: {
    position: 'absolute',
    top: -6,
    right: 54,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 8,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
  },

  panel: { alignSelf: 'stretch', borderRadius: RADIUS.card, borderCurve: 'continuous', padding: 20, paddingBottom: 16, gap: 16 },
  list: { borderRadius: RADIUS.card - 8, borderCurve: 'continuous', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  listTexts: { flex: 1, gap: 2 },
  privacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  privacyText: { flexShrink: 1, fontSize: 14, fontWeight: '500', textAlign: 'center' },

  panelShadow: { alignSelf: 'stretch', borderRadius: RADIUS.card, boxShadow: '0 10px 30px rgba(240, 113, 138, 0.25)' },
  lockScreen: { borderRadius: RADIUS.card, borderCurve: 'continuous', overflow: 'hidden', padding: 16, alignItems: 'center', gap: 20 },
  clock: { color: '#FFFFFF', fontSize: 72, fontWeight: '700', letterSpacing: -2, marginTop: 12 },
  notification: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 14,
  },
  appIcon: { width: 44, height: 44, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  notificationTexts: { flex: 1, gap: 2 },
  notificationHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  notificationTitle: { flex: 1, color: '#0B0B0C', fontSize: 15 },
  notificationTime: { color: '#6B6B70', fontWeight: '400' },
  notificationBody: { color: '#0B0B0C' },
  bell: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
