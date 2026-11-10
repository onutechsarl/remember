import { DateTimePicker, Host } from '@expo/ui/jetpack-compose';
import { StyleSheet } from 'react-native';

import { useColors } from '@/theme/use-colors';

import type { DayPickerProps } from './day-picker';
import { PickerCard } from './form';

/** Le calendrier Material 3 renvoie le jour choisi à minuit UTC : on le ramène en date locale. */
const fromUtcDay = (date: Date) => new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
const toUtcDay = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

/** Calendrier Material 3, dans une carte. */
export function DayPicker({ value, min, max, onChange }: DayPickerProps) {
  const colors = useColors();
  return (
    <PickerCard>
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <DateTimePicker
          initialDate={toUtcDay(value).toISOString()}
          variant="picker"
          displayedComponents="date"
          showVariantToggle={false}
          selectableDates={{ start: min && toUtcDay(min), end: max && toUtcDay(max) }}
          color={colors.accent}
          onDateSelected={(date) => onChange(fromUtcDay(date))}
        />
      </Host>
    </PickerCard>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'stretch' },
});
