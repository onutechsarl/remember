import { router } from 'expo-router';
import { Info, Users } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlphabetIndex } from '@/components/alphabet-index';
import { Avatar } from '@/components/avatar';
import { PrimaryButton } from '@/components/buttons';
import { SearchField, SelectionMark, Tag } from '@/components/form';
import { getDatabase } from '@/db/database';
import { trackedKeys } from '@/db/repository';
import { useAddFlow } from '@/hooks/add-flow';
import {
  getContactsAccess,
  grantMoreContacts,
  readDeviceContacts,
  requestContactsAccess,
  type ContactsAccess,
  type DeviceContact,
} from '@/services/contacts';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';
import { formatPhone } from '@/utils/phone';

type Directory = { contacts: DeviceContact[]; tracked: Set<string> };
type Section = { title: string; data: DeviceContact[] };

/**
 * Hauteurs fixes des titres de section et des lignes : elles permettent de calculer la position
 * de chaque section pour l'index alphabétique, même pour les sections pas encore affichées.
 */
const SECTION_HEADER_HEIGHT = 32;
const ROW_HEIGHT = 64;

/** Clé de recherche et de tri : minuscules, sans accents. */
const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Accès au répertoire et contacts lisibles, avec ceux déjà suivis (US-04 CA4). */
async function fetchDirectory(): Promise<{ access: ContactsAccess; directory: Directory }> {
  const access = await getContactsAccess();
  if (access !== 'all' && access !== 'limited') return { access, directory: { contacts: [], tracked: new Set() } };
  const contacts = await readDeviceContacts();
  const keys = await trackedKeys(await getDatabase());
  const tracked = new Set(
    contacts
      .filter((c) => keys.deviceContactIds.has(c.deviceContactId) || (c.phoneE164 && keys.phones.has(c.phoneE164)))
      .map((c) => c.deviceContactId),
  );
  return { access, directory: { contacts, tracked } };
}

function sectionLetter(name: string): string {
  const first = normalize(name).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

/** Sélection dans le répertoire (US-04 ; accès refusé ou limité, US-02 CA3 et CA4). */
export default function SelectContactsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selected, setSelected } = useAddFlow();

  const [access, setAccess] = useState<ContactsAccess | 'loading'>('loading');
  const [directory, setDirectory] = useState<Directory>({ contacts: [], tracked: new Set() });
  const [query, setQuery] = useState('');
  const list = useRef<SectionList<DeviceContact, Section>>(null);
  const listHeaderHeight = useRef(0);

  const load = useCallback(
    () =>
      fetchDirectory()
        .then((result) => {
          setDirectory(result.directory);
          setAccess(result.access);
        })
        .catch((error: unknown) => console.error('Répertoire : lecture impossible', error)),
    [],
  );

  useEffect(() => {
    void load();
    // Au retour des Réglages du téléphone, l'accès a pu changer.
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && void load());
    return () => subscription.remove();
  }, [load]);

  const sections = useMemo(() => {
    const q = normalize(query.trim());
    const digits = query.replace(/\D/g, '');
    const matches = directory.contacts.filter(
      (c) =>
        !q ||
        normalize(c.name).includes(q) ||
        (digits.length >= 3 && (c.phoneE164 ?? c.phoneRaw ?? '').replace(/\D/g, '').includes(digits)),
    );
    const groups = new Map<string, DeviceContact[]>();
    for (const c of matches) {
      const letter = sectionLetter(c.name);
      groups.set(letter, [...(groups.get(letter) ?? []), c]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
      .map(([title, data]) => ({ title, data }));
  }, [directory.contacts, query]);

  /** Fait défiler la liste jusqu'au titre de la section (index alphabétique). */
  const jumpTo = (sectionIndex: number) => {
    if (sectionIndex < 0) return;
    const y = sections
      .slice(0, sectionIndex)
      .reduce((offset, s) => offset + SECTION_HEADER_HEIGHT + s.data.length * ROW_HEIGHT, listHeaderHeight.current);
    list.current?.getScrollResponder()?.scrollTo({ y, animated: false });
  };

  const selectedIds = new Set(selected.map((c) => c.deviceContactId));
  const toggle = (contact: DeviceContact) =>
    setSelected(
      selectedIds.has(contact.deviceContactId)
        ? selected.filter((c) => c.deviceContactId !== contact.deviceContactId)
        : [...selected, contact],
    );

  if (access === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (access === 'undetermined' || access === 'denied') {
    const denied = access === 'denied';
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.illustration, { backgroundColor: colors.accentSoft }]}>
          <Users color={colors.accent} size={56} strokeWidth={1.8} />
        </View>
        <Text style={[Type.sectionTitle, styles.centerText, { color: colors.text }]}>
          {t(denied ? 'add.denied.title' : 'add.request.title')}
        </Text>
        <Text style={[Type.body, styles.centerText, { color: colors.textSecondary }]}>
          {t(denied ? 'add.denied.body' : 'add.request.body')}
        </Text>
        <PrimaryButton
          label={t(denied ? 'add.denied.action' : 'add.request.action')}
          onPress={() => (denied ? void Linking.openSettings() : void requestContactsAccess().then(() => load()))}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.screen}>
        <SectionList
          ref={list}
          sections={sections}
          keyExtractor={(c) => c.deviceContactId}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled
          ListHeaderComponent={
            <View style={styles.listHeader} onLayout={(e) => (listHeaderHeight.current = e.nativeEvent.layout.height)}>
              <SearchField value={query} onChangeText={setQuery} placeholder={t('add.search')} />
              {access === 'limited' && (
                <View style={styles.limited}>
                  <Info color={colors.textSecondary} size={18} />
                  <Text style={[Type.secondary, styles.limitedText, { color: colors.textSecondary }]}>
                    {t('add.limited', { count: directory.contacts.length })}{' '}
                    <Text
                      style={{ color: colors.accentText, fontWeight: '600' }}
                      onPress={() => void grantMoreContacts().then(() => load())}
                      accessibilityRole="button">
                      {t('add.manage')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <Text style={[Type.body, styles.emptyText, { color: colors.textSecondary }]}>
              {query ? t('add.noResults', { query }) : t('add.emptyDirectory')}
            </Text>
          }
          renderSectionHeader={({ section }) => (
            <Text style={[Type.caption, styles.letter, { color: colors.textSecondary, backgroundColor: colors.background }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <DirectoryRow
              contact={item}
              tracked={directory.tracked.has(item.deviceContactId)}
              checked={selectedIds.has(item.deviceContactId)}
              onPress={() => toggle(item)}
            />
          )}
        />
        {!query && sections.length > 1 && (
          <AlphabetIndex
            sections={sections.map((s) => s.title)}
            onSelect={jumpTo}
            letterLabel={(letter) => t('add.indexLetter', { letter })}
          />
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.separator }]}>
        {selected.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {selected.map((c) => (
              <Pressable
                key={c.deviceContactId}
                onPress={() => toggle(c)}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel={c.name}>
                <Avatar id={c.deviceContactId} name={c.name} size={52} />
                <Text style={[Type.caption, { color: colors.textSecondary, fontWeight: '400' }]} numberOfLines={1}>
                  {c.name.split(/\s+/)[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <PrimaryButton
          block
          disabled={selected.length === 0}
          label={selected.length ? t('add.continueCount', { count: selected.length }) : t('add.continue')}
          onPress={() => router.push({ pathname: '/add/settings', params: { step: '0' } })}
        />
      </View>
    </View>
  );
}

function DirectoryRow({
  contact,
  tracked,
  checked,
  onPress,
}: {
  contact: DeviceContact;
  tracked: boolean;
  checked: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const phone = contact.phoneE164 ? formatPhone(contact.phoneE164) : (contact.phoneRaw ?? t('add.noPhone'));
  return (
    <Pressable
      onPress={onPress}
      disabled={tracked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: tracked }}
      accessibilityLabel={`${contact.name}, ${tracked ? t('add.alreadyTracked') : phone}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.fill }]}>
      <SelectionMark checked={checked} disabled={tracked} />
      <View style={[styles.rowBody, tracked && styles.dimmed]}>
        <Avatar id={contact.deviceContactId} name={contact.name} size={48} />
        <View style={styles.rowTexts}>
          <Text style={[Type.body, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {contact.name}
          </Text>
          <Text style={[Type.secondary, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {phone}
          </Text>
        </View>
      </View>
      {tracked && <Tag label={t('add.alreadyTracked')} tone="neutral" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  illustration: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  centerText: { textAlign: 'center' },
  listHeader: { paddingLeft: 20, paddingRight: 34, paddingTop: 4, paddingBottom: 4, gap: 10 },
  limited: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  limitedText: { flex: 1 },
  emptyText: { textAlign: 'center', padding: 32 },
  letter: { height: SECTION_HEADER_HEIGHT, paddingHorizontal: 20, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 20, paddingRight: 34, height: ROW_HEIGHT },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowTexts: { flex: 1, gap: 2 },
  dimmed: { opacity: 0.45 },
  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  chips: { gap: 16, paddingHorizontal: 4 },
  chip: { alignItems: 'center', gap: 4, width: 64 },
});
