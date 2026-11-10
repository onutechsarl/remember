import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { useColors } from '@/theme/use-colors';

import { dateToTime, timeToDate } from '@/utils/time';

import type { TimePickerProps } from './time-picker';

/** Roue des heures SwiftUI. */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const colors = useColors();
  return (
    <Host matchContents={{ vertical: true }} style={styles.host}>
      <DatePicker
        selection={timeToDate(value)}
        displayedComponents={['hourAndMinute']}
        onDateChange={(date) => onChange(dateToTime(date))}
        modifiers={[datePickerStyle('wheel'), tint(colors.accent)]}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'stretch' },
});
