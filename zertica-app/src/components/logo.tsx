import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/theme';

/** Logotipo oficial (extraído de la presentación del proyecto). */
export function Logo({ size = 72, showName = false }: { size?: number; showName?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.22 }]}>
        <Image source={require('@/assets/images/icon.png')} style={{ width: size, height: size }} contentFit="cover" />
      </View>
      {showName ? (
        <View style={styles.names}>
          <Text style={styles.name}>Zertica</Text>
          <Text style={styles.tagline}>Drywall Shop</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  badge: { overflow: 'hidden', backgroundColor: colors.navy, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  names: { alignItems: 'center', marginTop: 12 },
  name: { color: colors.white, fontSize: 24, fontWeight: font.heavy },
  tagline: { color: colors.textOnDarkMuted, fontSize: 13, marginTop: 2 },
});
