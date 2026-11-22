import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge } from '@/components/status-badge';
import { TextField } from '@/components/text-field';
import { useAdminCategories, useCategoryStatus, useSaveCategory } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { apiFieldErrors } from '@/lib/forms';
import { colors, font, radius } from '@/theme';

/** CU-22 Crear, CU-23 Editar, CU-24 Desactivar (desde la edición). */
export function CategoryFormScreen({ id }: { id: number | null }) {
  const { t } = useI18n();
  const categories = useAdminCategories();
  const category = categories.data?.find((c) => c.id === id);
  if (id === null) return <CategoryForm id={null} initialName="" />;
  const header = <ScreenHeader title={t('admin.editCategory')} back />;
  if (categories.isPending) {
    return (
      <View style={styles.flex}>
        {header}
        <LoadingView />
      </View>
    );
  }
  if (categories.isError || !category) {
    return (
      <View style={styles.flex}>
        {header}
        <ErrorView error={categories.error ?? new ApiError(404, 'CATEGORY_NOT_FOUND', '')} onRetry={() => categories.refetch()} />
      </View>
    );
  }
  return <CategoryForm id={id} initialName={category.name} />;
}

function CategoryForm({ id, initialName }: { id: number | null; initialName: string }) {
  const { t, errorMessage, fieldMessage } = useI18n();
  const isNew = id === null;
  const categories = useAdminCategories();
  const category = categories.data?.find((c) => c.id === id);
  const save = useSaveCategory(id);
  const toggle = useCategoryStatus();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async () => {
    const value = name.trim();
    if (!value) return setError(t('validation.REQUIRED'));
    if (value.length > 100) return setError(t('validation.TOO_LONG'));
    setError(undefined);
    setServerError(null);
    try {
      await save.mutateAsync(value);
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError(errorMessage(err));
      else {
        const fields = apiFieldErrors(err, fieldMessage);
        if (fields.name) setError(fields.name);
        else setServerError(errorMessage(err));
      }
    }
  };

  const toggleStatus = async () => {
    if (!category) return;
    const activating = !category.isActive;
    const ok = await confirmAction(
      activating ? t('admin.reactivateCategoryTitle') : t('admin.deactivateCategoryTitle'),
      activating ? t('admin.reactivateCategoryBody', { name: category.name }) : t('admin.deactivateCategoryBody', { name: category.name }),
      activating ? t('common.reactivate') : t('common.deactivate'),
      t('common.cancel'),
      !activating,
    );
    if (!ok) return;
    try {
      await toggle.mutateAsync({ id: category.id, isActive: activating });
    } catch (err) {
      showMessage(t('admin.categories'), errorMessage(err));
    }
  };

  const header = <ScreenHeader title={isNew ? t('admin.newCategory') : t('admin.editCategory')} back />;

  return (
    <View style={styles.flex}>
      {header}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Notice message={serverError} />
        {category ? (
          <View style={styles.statusCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.label}>{t('admin.status')}</Text>
              <StatusBadge active={category.isActive} />
              <Text style={styles.meta}>{(category.productCount === 1 ? t('admin.productsCountOne') : t('admin.productsCount', { count: category.productCount }))}</Text>
            </View>
            <Button
              title={category.isActive ? t('common.deactivate') : t('common.reactivate')}
              variant={category.isActive ? 'danger' : 'outline'}
              size="sm"
              loading={toggle.isPending}
              onPress={toggleStatus}
            />
          </View>
        ) : null}
        <TextField
          label={t('admin.categoryName')}
          value={name}
          onChangeText={setName}
          maxLength={100}
          error={error}
          autoFocus={isNew}
          onSubmitEditing={submit}
        />
        <Button title={t('common.save')} onPress={submit} loading={save.isPending} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 18,
  },
  label: { fontSize: 13, fontWeight: font.semibold, color: '#4A5468' },
  meta: { fontSize: 12, color: colors.textMuted },
});
