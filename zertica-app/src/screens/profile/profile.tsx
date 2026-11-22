import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { MenuCard, StatsCard } from '@/components/menu-card';
import { ProfileHero } from '@/components/profile-hero';
import { HeaderIconButton } from '@/components/screen-header';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAddresses, useOrderStats } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { money } from '@/lib/format';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

/** CU-06 Consultar perfil — pantalla "Mi Perfil" de Figma. Acceso a CU-07, CU-08, idioma y CU-05. */
export function ProfileScreen() {
  const { t, language } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const canBuy = user?.role === 'user' || user?.role === 'company';
  const stats = useOrderStats(canBuy);
  const addresses = useAddresses();
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
      <ProfileHero
        title={t('profile.title')}
        subtitle={user.fullName}
        name={user.fullName}
        email={user.email}
        right={<HeaderIconButton emoji="⚙️" label={t('profile.language')} onPress={() => router.push('/language-settings')} />}
        badges={
          <>
            <Tag tone="navy" label={isAdmin ? t('profile.roleAdmin') : t('profile.roleUser')} />
            <StatusBadge active={user.isActive} />
          </>
        }
      />
      <StatsCard
        items={
          canBuy
            ? [
                { value: String(stats.data?.orders ?? '—'), label: t('profileMenu.orders') },
                { value: stats.data ? money(stats.data.spent, language) : '—', label: t('profileMenu.spent') },
                { value: String(addresses.data?.length ?? '—'), label: t('profileMenu.addressesShort') },
              ]
            : [
                { value: `@${user.username}`, label: t('profile.username') },
                { value: user.language.toUpperCase(), label: t('profile.statLanguage') },
                { value: String(new Date(user.createdAt).getFullYear()), label: t('profile.statSince') },
              ]
        }
      />
      <View style={styles.body}>
        <MenuCard
          emoji="👤"
          title={t('profile.personalData')}
          subtitle={t('profile.personalDataSub')}
          onPress={() => router.push('/profile-edit')}
          testID="profile-edit"
        />
        <MenuCard
          emoji="🏠"
          title={t('profileMenu.addresses')}
          subtitle={t('addresses.count', { count: addresses.data?.length ?? 0 })}
          onPress={() => router.push('/addresses')}
        />
        <MenuCard emoji="💳" title={t('profileMenu.payments')} subtitle={t('payments.title')} onPress={() => router.push('/payment-methods')} />
        <MenuCard
          emoji="🔒"
          title={t('profile.security')}
          subtitle={t('profile.securitySub')}
          onPress={() => router.push('/change-password')}
        />
        <MenuCard
          emoji="🌐"
          title={t('profile.language')}
          subtitle={user.language === 'es' ? 'Español' : 'English'}
          onPress={() => router.push('/language-settings')}
        />
        <MenuCard emoji="❓" title={t('profileMenu.help')} subtitle={t('profileMenu.helpSub')} onPress={() => router.push('/help')} />
        <MenuCard emoji="📜" title={t('profileMenu.terms')} subtitle={t('profileMenu.termsSub')} onPress={() => router.push('/terms')} />
        {isAdmin ? (
          <MenuCard emoji="🛡️" title={t('home.adminPanel')} subtitle={t('profile.adminPanelSub')} onPress={() => router.navigate('/admin')} />
        ) : null}
        <Button
          title={signingOut ? t('common.loading') : t('profile.logout')}
          variant="dangerSolid"
          onPress={logout}
          disabled={signingOut}
          style={{ marginTop: 8 }}
          testID="logout"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: 16 },
});
