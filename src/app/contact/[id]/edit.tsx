import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Group } from '@/components/form';
import { getDatabase } from '@/db/database';
import { getContact, updateContact } from '@/db/repository';
import { deviceCountry } from '@/services/contacts';
import { replan } from '@/services/planning';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';
import { formatPhone, toE164 } from '@/utils/phone';

/** Modifier le nom et le numéro d'un contact, notamment un numéro non convertible (maquettes, écran 4). */
export default function EditContactScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getDatabase()
      .then((db) => getContact(db, id))
      .then((contact) => {
        if (!contact) return;
        setName(contact.displayName);
        setPhone(contact.phoneE164 ? formatPhone(contact.phoneE164) : '');
      });
  }, [id]);

  const save = async () => {
    const displayName = name.trim();
    if (!displayName) return setError(t('contact.editor.nameRequired'));
    const phoneE164 = phone.trim() ? toE164(phone, deviceCountry()) : null;
    if (phone.trim() && !phoneE164) return setError(t('contact.editor.invalidPhone'));

    setSaving(true);
    try {
      const db = await getDatabase();
      const now = new Date();
      await updateContact(db, id, { displayName, phoneE164 }, now);
      await replan(db, now);
      router.back();
    } catch (e) {
      // Index unique sur phone_e164 parmi les contacts suivis (data-model.pdf).
      setError(String(e).includes('UNIQUE') ? t('contact.editor.duplicate') : t('common.error'));
      setSaving(false);
    }
  };

  const background = Platform.OS === 'ios' ? colors.groupedBackground : colors.background;
  const headerButton = (label: string, onPress: () => void, bold = false) => (
    <Pressable onPress={onPress} disabled={saving} hitSlop={10} accessibilityRole="button">
      <Text style={[Type.body, styles.headerText, { color: colors.accentText, fontWeight: bold ? '600' : '400' }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: t('contact.editor.title'),
          headerStyle: { backgroundColor: background },
          headerShadowVisible: false,
          headerLeft: () => headerButton(t('common.cancel'), () => router.back()),
          headerRight: () => headerButton(t('common.save'), () => void save(), true),
        }}
      />
      <Group>
        <Field label={t('contact.editor.name')} value={name} onChangeText={setName} autoComplete="name" />
        <Field
          label={t('contact.editor.phone')}
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            setError(null);
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          last
        />
      </Group>
      <Text style={[Type.caption, styles.hint, { color: error ? colors.red : colors.textSecondary }]}>
        {error ?? t('contact.editor.phoneHint')}
      </Text>
    </ScrollView>
  );
}

function Field({
  label,
  last,
  ...input
}: { label: string; last?: boolean } & React.ComponentProps<typeof TextInput>) {
  const colors = useColors();
  return (
    <View style={[styles.field, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
      <Text style={[Type.body, styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        style={[Type.body, styles.fieldInput, { color: colors.text }]}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  // Marges dans la capsule de verre qu'iOS 26 dessine autour des boutons de la barre.
  headerText: { paddingHorizontal: Platform.OS === 'ios' ? 12 : 0 },
  hint: { paddingHorizontal: 16, paddingTop: 8, fontWeight: '400' },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 52, marginLeft: 16, paddingRight: 16 },
  fieldLabel: { width: 90 },
  fieldInput: { flex: 1, paddingVertical: 12 },
});
