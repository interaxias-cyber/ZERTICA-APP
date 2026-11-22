import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font } from '@/theme';
import { Avatar } from './avatar';
import { Logo } from './logo';

interface Props {
  title: string;
  subtitle: string;
  name: string;
  email: string;
  badges: ReactNode;
  right?: ReactNode;
  /** Inicial única (cuenta de administrador) o iniciales. */
  singleInitial?: boolean;
  leading?: ReactNode;
}

/** Cabecera "Mi Perfil" de Figma: avatar circular grande, nombre, correo y pastillas. */
export function ProfileHero({ title, subtitle, name, email, badges, right, singleInitial, leading }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        {leading ?? <Logo size={40} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {right}
      </View>
      <View style={styles.center}>
        <Avatar name={name} size={96} single={singleInitial} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.badges}>{badges}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingBottom: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  title: { color: colors.white, fontSize: 17, fontWeight: font.heavy },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 13 },
  center: { alignItems: 'center', marginTop: 22 },
  name: { color: colors.white, fontSize: 22, fontWeight: font.heavy, marginTop: 14 },
  email: { color: colors.textOnDarkMuted, fontSize: 15, marginTop: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
