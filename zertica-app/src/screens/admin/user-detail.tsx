import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ListRow, Section } from '@/components/list-row';
import { Notice } from '@/components/notice';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAdminUser, useUserStatus } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius } from '@/theme';

/** CU-26 Ver detalle (sin hash de contraseña) y CU-27 Activar / desactivar. */
export function UserDetailScreen({ id }: { id: number }) {
  const { t, errorMessage, language } = useI18n();
  const { user: me } = useAuth();
  const query = useAdminUser(id);
  const toggle = useUserStatus();
  const user = query.data;
  const isSelf = me?.id === id;

  const onToggle = async () => {
    if (!user) return;
    const activating = !user.isActive;
    const ok = await confirmAction(
      activating ? t('admin.activateUserTitle') : t('admin.deactivateUserTitle'),
      activating ? t('admin.activateUserBody', { name: user.fullName }) : t('admin.deactivateUserBody', { name: user.fullName }),
      activating ? t('common.activate') : t('common.deactivate'),
      t('common.cancel'),
      !activating,
    );
    if (!ok) return;
    try {
      await toggle.mutateAsync({ id: user.id, isActive: activating });
    } catch (err) {
      showMessage(t('admin.users'), errorMessage(err));
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('admin.userDetail')} back />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError || !user ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.identity}>
            <Avatar name={user.fullName} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>
                {user.fullName}
                {isSelf ? ` (${t('admin.you')})` : ''}
              </Text>
              <Text style={styles.username}>@{user.username}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <StatusBadge active={user.isActive} />
                <Tag label={user.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')} tone="orange" />
              </View>
            </View>
          </View>

          <Section>
            <ListRow icon="email-outline" title={t('profile.email')} value={user.email} />
            <ListRow icon="translate" title={t('profile.language')} value={user.language === 'es' ? 'Español' : 'English'} />
            <ListRow
              icon="calendar-outline"
              title={t('admin.createdAt')}
              value={new Date(user.createdAt).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US')}
              last
            />
          </Section>

          {isSelf ? (
            <Notice tone="info" message={t('admin.cannotDeactivateSelf')} />
          ) : (
            <Button
              title={user.isActive ? t('common.deactivate') : t('common.activate')}
              icon={user.isActive ? 'account-cancel-outline' : 'account-check-outline'}
              variant={user.isActive ? 'danger' : 'secondary'}
              loading={toggle.isPending}
              onPress={onToggle}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 18,
  },
  name: { fontSize: 18, fontWeight: font.heavy, color: colors.text },
  username: { fontSize: 13, color: colors.textMuted },
});
