import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { startOfLocalDay } from '@/domain/dates';
import { useColors } from '@/theme/use-colors';

import type { DayPickerProps } from './day-picker';

/** Calendrier SwiftUI (style graphique). */
export function DayPicker({ value, max, onChange }: DayPickerProps) {
  const colors = useColors();
  return (
    <Host matchContents={{ vertical: true }} style={styles.host}>
      <DatePicker
        selection={value}
        range={{ end: max }}
        displayedComponents={['date']}
        onDateChange={(date) => onChange(startOfLocalDay(date))}
        modifiers={[datePickerStyle('graphical'), tint(colors.accent)]}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'stretch' },
});
