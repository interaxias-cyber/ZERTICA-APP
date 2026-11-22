import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { MenuCard, StatsCard } from '@/components/menu-card';
import { ProfileHero } from '@/components/profile-hero';
import { HeaderIconButton } from '@/components/screen-header';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAdminSummary } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

/** "Mi cuenta" del administrador (Figma), con las opciones del MVP. */
export function AdminAccountScreen() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const summary = useAdminSummary();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;

  const logout = async () => {
    const ok = await confirmAction(t('profile.logoutTitle'), t('profile.logoutConfirm'), t('common.yes'), t('common.no'), true);
    if (!ok) return;
    setSigningOut(true);
    await signOut();
  };

  const s = summary.data;
  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 32 }}>
      <ProfileHero
        title={t('adminHome.accountTitle')}
        subtitle={user.email}
        name={user.fullName}
        email={user.email}
        singleInitial
        leading={<Avatar name={user.fullName} single shape="rounded" size={40} />}
        right={<HeaderIconButton emoji="⚙️" label={t('profile.language')} onPress={() => router.push('/language-settings')} />}
        badges={
          <>
            <Tag tone="orange" label={t('adminHome.roleBadge')} />
            <StatusBadge active={user.isActive} />
          </>
        }
      />
      <StatsCard
        items={[
          { value: s ? String(s.products.total) : '—', label: t('tabs.products') },
          { value: s ? String(s.users.total) : '—', label: t('tabs.users') },
          { value: s ? String(s.categories.total) : '—', label: t('tabs.categories') },
        ]}
      />
      <View style={styles.body}>
        <MenuCard emoji="👤" title={t('adminHome.adminData')} subtitle={t('adminHome.adminDataSub')} onPress={() => router.push('/profile-edit')} />
        <MenuCard emoji="🔒" title={t('profile.changePassword')} subtitle={t('adminHome.securitySub')} onPress={() => router.push('/change-password')} />
        <MenuCard
          emoji="🌐"
          title={t('profile.language')}
          subtitle={user.language === 'es' ? 'Español' : 'English'}
          onPress={() => router.push('/language-settings')}
        />
        <MenuCard emoji="📦" title={t('adminHome.viewCatalog')} onPress={() => router.navigate('/catalog')} />
        <Button
          title={signingOut ? t('common.loading') : t('profile.logout')}
          variant="dangerSolid"
          onPress={logout}
          disabled={signingOut}
          style={{ marginTop: 8 }}
          testID="admin-logout"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: 16 },
});
