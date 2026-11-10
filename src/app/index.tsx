import { router } from 'expo-router';
import { BellOff, ChevronDown, Plus, Settings as SettingsIcon, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, RoundIconButton } from '@/components/buttons';
import { ContactRow } from '@/components/contact-row';
import { NoticeBanner } from '@/components/notice-banner';
import { ReviewFab } from '@/components/review-fab';
import type { TrackedContact } from '@/domain/types';
import { useHomeData, type HomeData } from '@/hooks/use-home-data';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

type SectionKey = 'due' | 'ok';

/** Accueil « À recontacter » (US-08 ; bouton du bilan US-14 CA7 ; bandeau US-03 CA2). */
export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, reload, markDone } = useHomeData();

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerButtons}>
        <RoundIconButton
          icon={SettingsIcon}
          variant="neutral"
          accessibilityLabel={t('common.settings')}
          onPress={() => router.push('/settings')}
        />
        <RoundIconButton icon={Plus} variant="accent" accessibilityLabel={t('common.add')} onPress={() => router.push('/add')} />
      </View>
      <Text style={[Type.largeTitle, { color: colors.text }]} accessibilityRole="header">
        {t('home.title')}
      </Text>
    </View>
  );

  if (state.status !== 'ready') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centered}>
          {state.status === 'loading' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Text style={[Type.body, { color: colors.textSecondary }]}>{t('common.loadError')}</Text>
              <PrimaryButton label={t('common.retry')} onPress={() => void reload()} />
            </>
          )}
        </View>
      </View>
    );
  }

  const { data } = state;
  const banner = data.notificationsDenied && (
    <View style={styles.banner}>
      <NoticeBanner
        icon={BellOff}
        title={t('home.notificationsOff.title')}
        body={t('home.notificationsOff.body')}
        onPress={() => void Linking.openSettings()}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {data.due.length + data.ok.length === 0 ? (
        <>
          {header}
          {banner}
          <EmptyState />
        </>
      ) : (
        <ContactList
          data={data}
          header={
            <>
              {header}
              {banner}
            </>
          }
          onMarkDone={(id) => void markDone(id)}
        />
      )}
      {data.reviewCount > 0 && <ReviewFab count={data.reviewCount} onPress={() => router.push('/review')} />}
    </View>
  );
}

function ContactList({
  data,
  header,
  onMarkDone,
}: {
  data: HomeData;
  header: React.ReactElement;
  onMarkDone: (id: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [okCollapsed, setOkCollapsed] = useState(false);

  const sections = [
    { key: 'due' as SectionKey, total: data.due.length, data: data.due },
    { key: 'ok' as SectionKey, total: data.ok.length, data: okCollapsed ? [] : data.ok },
  ].filter((s) => s.total > 0);

  return (
    <SectionList<TrackedContact, { key: SectionKey; total: number }>
      sections={sections}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={header}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={[Type.sectionTitle, { color: colors.text }]} accessibilityRole="header">
            {t(section.key === 'due' ? 'home.due' : 'home.ok')}
            <Text style={[Type.secondary, { color: colors.textSecondary }]}>{`  ${section.total}`}</Text>
          </Text>
          {section.key === 'ok' && (
            <Pressable
              onPress={() => setOkCollapsed((v) => !v)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityState={{ expanded: !okCollapsed }}
              accessibilityLabel={t(okCollapsed ? 'home.showSection' : 'home.hideSection')}>
              <ChevronDown
                color={colors.textSecondary}
                size={24}
                style={{ transform: [{ rotate: okCollapsed ? '-90deg' : '0deg' }] }}
              />
            </Pressable>
          )}
        </View>
      )}
      renderItem={({ item }) => (
        <ContactRow
          contact={item}
          now={data.now}
          onPress={() => router.push({ pathname: '/contact/[id]', params: { id: item.id } })}
          onMarkDone={() => onMarkDone(item.id)}
        />
      )}
    />
  );
}

function EmptyState() {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.illustration, { backgroundColor: colors.accentSoft }]}>
        <Users color={colors.accent} size={64} strokeWidth={1.8} />
      </View>
      <Text style={[Type.sectionTitle, styles.emptyTitle, { color: colors.text }]}>{t('home.empty.title')}</Text>
      <Text style={[Type.body, styles.emptyBody, { color: colors.textSecondary }]}>{t('home.empty.body')}</Text>
      <PrimaryButton icon={UserPlus} label={t('home.empty.action')} onPress={() => router.push('/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  headerButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  banner: { marginTop: 8, marginBottom: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 80 },
  illustration: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 26, textAlign: 'center' },
  emptyBody: { textAlign: 'center', marginTop: 8, marginBottom: 28 },
});
