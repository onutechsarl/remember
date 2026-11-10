import { Platform, StyleSheet } from 'react-native';

/**
 * Typographie des maquettes : Inter sur iOS (intégrée au build par le plugin expo-font),
 * Roboto, la police système, sur Android (maquettes Android, « Différences avec iOS »).
 */
const family = Platform.select({ ios: 'Inter', default: undefined });

export const Type = StyleSheet.create({
  largeTitle: { fontFamily: family, fontSize: 34, fontWeight: '700', letterSpacing: Platform.OS === 'ios' ? -0.6 : 0 },
  sectionTitle: { fontFamily: family, fontSize: 20, fontWeight: Platform.OS === 'ios' ? '700' : '500' },
  name: { fontFamily: family, fontSize: 17, fontWeight: '600' },
  body: { fontFamily: family, fontSize: 17, fontWeight: '400' },
  secondary: { fontFamily: family, fontSize: 15, fontWeight: '400' },
  caption: { fontFamily: family, fontSize: 13, fontWeight: '600' },
  groupHeader: { fontFamily: family, fontSize: 13, fontWeight: '400', textTransform: 'uppercase' },
  button: { fontFamily: family, fontSize: 17, fontWeight: '600' },
});
