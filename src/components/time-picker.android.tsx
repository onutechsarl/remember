import { DateTimePicker, Host } from '@expo/ui/jetpack-compose';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { useColors } from '@/theme/use-colors';
import { dateToTime, timeToDate } from '@/utils/time';

import { PickerCard } from './form';
import type { TimePickerProps } from './time-picker';

/** Cadran Material 3, centré dans une carte ; l'heure renvoyée est en heure locale. */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  return (
    <PickerCard>
      <Host matchContents style={styles.host}>
        <DateTimePicker
          initialDate={timeToDate(value).toISOString()}
          displayedComponents="hourAndMinute"
          is24Hour={i18n.language !== 'en'}
          color={colors.accent}
          onDateSelected={(date) => onChange(dateToTime(date))}
        />
      </Host>
    </PickerCard>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'center' },
});
