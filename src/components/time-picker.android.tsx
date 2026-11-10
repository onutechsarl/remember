import { DateTimePicker, Host } from '@expo/ui/jetpack-compose';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { useColors } from '@/theme/use-colors';

import { dateToTime, timeToDate } from '@/utils/time';

import type { TimePickerProps } from './time-picker';

/** Cadran Material 3 ; l'heure renvoyée est en heure locale. */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  return (
    <Host matchContents={{ vertical: true }} style={styles.host}>
      <DateTimePicker
        initialDate={timeToDate(value).toISOString()}
        displayedComponents="hourAndMinute"
        is24Hour={i18n.language !== 'en'}
        color={colors.accent}
        onDateSelected={(date) => onChange(dateToTime(date))}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'stretch' },
});
