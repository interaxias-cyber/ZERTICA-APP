import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { ListRow, Section } from '@/components/list-row';
import { Tag } from '@/components/status-badge';
import { useI18n } from '@/i18n';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius } from '@/theme';

/** CU-06 Consultar perfil, acceso a CU-07, CU-08, idioma (RF09) y CU-05 cerrar sesión. */
export function ProfileScreen() {
  const { t } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const logout = async () => {
    // RN17: cerrar sesión exige confirmación.
    const ok = await confirmAction(t('profile.logoutTitle'), t('profile.logoutConfirm'), t('common.yes'), t('common.no'), true);
    if (!ok) return;
    setSigningOut(true);
    await signOut();
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.identity}>
          <Avatar name={user.fullName} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <View style={{ marginTop: 6 }}>
              <Tag label={isAdmin ? t('profile.roleAdmin') : t('profile.roleUser')} tone="orange" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Section title={t('profile.account')}>
          <ListRow icon="account-outline" title={t('profile.username')} value={user.username} />
          <ListRow icon="card-account-details-outline" title={t('auth.fullName')} value={user.fullName} />
          <ListRow icon="email-outline" title={t('profile.email')} value={user.email} last />
        </Section>

        <Section title={t('profile.preferences')}>
          <ListRow icon="pencil-outline" title={t('profile.editProfile')} onPress={() => router.push('/profile-edit')} testID="profile-edit" />
          <ListRow icon="lock-reset" title={t('profile.changePassword')} onPress={() => router.push('/change-password')} />
          <ListRow
            icon="translate"
            title={t('profile.language')}
            value={user.language === 'es' ? 'Español' : 'English'}
            onPress={() => router.push('/language-settings')}
            last
          />
        </Section>

        {isAdmin ? (
          <Section title={t('profile.administration')}>
            <ListRow icon="shield-account-outline" title={t('home.adminPanel')} subtitle={t('home.adminPanelSubtitle')} onPress={() => router.push('/admin')} last />
          </Section>
        ) : null}

        <Section>
          <ListRow
            icon="logout"
            title={signingOut ? t('common.loading') : t('profile.logout')}
            destructive
            onPress={signingOut ? undefined : logout}
            last
            testID="logout"
          />
        </Section>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTitle: { color: colors.white, fontSize: 19, fontWeight: font.heavy, marginBottom: 18 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { color: colors.white, fontSize: 19, fontWeight: font.heavy },
  username: { color: colors.textOnDarkMuted, fontSize: 13, marginTop: 2 },
  body: { padding: 16, paddingTop: 20 },
});
