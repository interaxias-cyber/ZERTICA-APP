import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { ListRow, Section } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

/** Panel administrativo: módulos D, E y F (solo rol admin). */
export function AdminHomeScreen() {
  const { t } = useI18n();
  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 30 }}>
      <ScreenHeader title={t('admin.title')} subtitle={t('admin.subtitle')} back />
      <ScrollView contentContainerStyle={styles.body} scrollEnabled={false}>
        <Section>
          <ListRow
            icon="package-variant-closed"
            title={t('admin.products')}
            subtitle={t('admin.productsSubtitle')}
            onPress={() => router.push('/admin/products')}
          />
          <ListRow
            icon="shape-outline"
            title={t('admin.categories')}
            subtitle={t('admin.categoriesSubtitle')}
            onPress={() => router.push('/admin/categories')}
          />
          <ListRow
            icon="account-group-outline"
            title={t('admin.users')}
            subtitle={t('admin.usersSubtitle')}
            onPress={() => router.push('/admin/users')}
            last
          />
        </Section>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16 },
});
