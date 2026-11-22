import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PickedImage } from '@/api/admin';
import type { AdminProduct } from '@/api/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { categoryIcon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { ProductImage } from '@/components/product-image';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge } from '@/components/status-badge';
import { TextField } from '@/components/text-field';
import { useAdminCategories, useAdminProduct, useProductStatus, useSaveProduct } from '@/hooks/use-admin';
import { useBrands } from '@/hooks/use-catalog';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { apiFieldErrors, type FieldErrors } from '@/lib/forms';
import { colors, font, radius } from '@/theme';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** CU-17 Agregar, CU-18 Editar, CU-21 Gestionar imagen. id = null → alta. */
export function ProductFormScreen({ id }: { id: number | null }) {
  const { t } = useI18n();
  const product = useAdminProduct(id);
  if (id === null) return <ProductForm initial={null} />;
  const header = <ScreenHeader title={t('admin.editProduct')} back />;
  if (product.isPending) {
    return (
      <View style={styles.flex}>
        {header}
        <LoadingView />
      </View>
    );
  }
  if (product.isError) {
    return (
      <View style={styles.flex}>
        {header}
        <ErrorView error={product.error} onRetry={() => product.refetch()} />
      </View>
    );
  }
  return <ProductForm initial={product.data} />;
}

function ProductForm({ initial }: { initial: AdminProduct | null }) {
  const { t, errorMessage, fieldMessage } = useI18n();
  const isNew = initial === null;
  const id = initial?.id ?? null;
  // Mantiene el estado actualizado (activo/inactivo) tras cambiarlo.
  const product = useAdminProduct(id);
  const current = product.data ?? initial;
  const categories = useAdminCategories();
  const brands = useBrands();
  const save = useSaveProduct(id);
  const toggle = useProductStatus();

  const [reference, setReference] = useState(initial?.reference ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(initial?.category.id ?? null);
  const [brandId, setBrandId] = useState<number | null>(initial?.brand.id ?? null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  /** Al corregir un campo se limpia su error. */
  const edit =
    <T,>(field: string, setter: (v: T) => void) =>
    (value: T) => {
      setter(value);
      setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
    };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showMessage(t('admin.image'), t('errors.FORBIDDEN'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const type = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      setErrors((e) => ({ ...e, image: t('validation.INVALID_IMAGE_TYPE') }));
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image: t('validation.IMAGE_TOO_LARGE') }));
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setImage({ uri: asset.uri, mimeType: type, fileName: asset.fileName });
  };

  const submit = async () => {
    const e: FieldErrors = {};
    if (!reference.trim()) e.reference = t('validation.REQUIRED');
    else if (!/^[A-Za-z0-9._\-/ ]{1,50}$/.test(reference.trim())) e.reference = t('validation.INVALID_FORMAT');
    if (!name.trim()) e.name = t('validation.REQUIRED');
    if (!categoryId) e.category_id = t('admin.selectCategory');
    if (!brandId) e.brand_id = t('admin.selectBrand');
    if (isNew && !image) e.image = t('admin.imageRequired');
    setErrors(e);
    setServerError(null);
    if (Object.values(e).some(Boolean)) return;
    try {
      await save.mutateAsync({
        reference: reference.trim(),
        name: name.trim(),
        description: description.trim(),
        categoryId: categoryId!,
        brandId: brandId!,
        image,
      });
      showMessage(isNew ? t('admin.created') : t('admin.updated'));
      router.back();
    } catch (err) {
      const fields = apiFieldErrors(err, fieldMessage);
      setErrors(fields);
      if (!(err instanceof ApiError) || Object.keys(fields).length === 0 || err.status === 409) {
        setServerError(errorMessage(err));
      }
    }
  };

  const toggleStatus = async () => {
    if (!current) return;
    const activating = !current.isActive;
    const ok = await confirmAction(
      activating ? t('admin.reactivateProductTitle') : t('admin.deactivateProductTitle'),
      activating
        ? t('admin.reactivateProductBody', { name: current.name })
        : t('admin.deactivateProductBody', { name: current.name }),
      activating ? t('common.reactivate') : t('common.deactivate'),
      t('common.cancel'),
      !activating,
    );
    if (!ok) return;
    try {
      const res = await toggle.mutateAsync({ id: current.id, isActive: activating });
      if (res.warning?.code === 'CATEGORY_INACTIVE') showMessage(t('admin.reactivateProductTitle'), t('admin.categoryInactiveWarning'));
    } catch (err) {
      showMessage(t('admin.products'), errorMessage(err));
    }
  };

  const header = <ScreenHeader title={isNew ? t('admin.newProduct') : t('admin.editProduct')} subtitle={current?.reference} back />;

  const previewUri = image?.uri ?? current?.imageUrl ?? null;
  const categoryName = categories.data?.find((c) => c.id === categoryId)?.name ?? '';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Notice message={serverError} />

        {!isNew && current ? (
          <View style={styles.statusCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.label}>{t('admin.status')}</Text>
              <StatusBadge active={current.isActive} />
            </View>
            <Button
              title={current.isActive ? t('common.deactivate') : t('common.reactivate')}
              variant={current.isActive ? 'danger' : 'outline'}
              size="sm"
              loading={toggle.isPending}
              onPress={toggleStatus}
            />
          </View>
        ) : null}

        <Text style={styles.label}>{t('admin.image')}</Text>
        <View style={[styles.imageBox, errors.image && { borderColor: colors.danger }]}>
          <ProductImage uri={previewUri} categoryName={categoryName} style={styles.image} iconSize={48} label={previewUri ? undefined : t('product.noImage')} />
          <Button
            title={previewUri ? t('admin.replaceImage') : t('admin.pickImage')}
            icon="image-plus"
            variant="secondary"
            size="sm"
            onPress={pickImage}
            style={styles.imageBtn}
          />
        </View>
        {errors.image ? <Text style={styles.error}>{errors.image}</Text> : null}

        <View style={{ height: 16 }} />
        <TextField
          label={t('admin.productReference')}
          value={reference}
          onChangeText={edit('reference', setReference)}
          autoCapitalize="characters"
          placeholder="PLC-STD-12"
          maxLength={50}
          error={errors.reference}
        />
        <TextField label={t('admin.productName')} value={name} onChangeText={edit('name', setName)} maxLength={150} error={errors.name} />
        <TextField
          label={t('admin.productDescription')}
          value={description}
          onChangeText={edit('description', setDescription)}
          multiline
          maxLength={2000}
          error={errors.description}
        />

        <Text style={styles.label}>{t('common.category')}</Text>
        <View style={styles.chips}>
          {(categories.data ?? []).map((c) => (
            <Chip
              key={c.id}
              label={c.isActive ? c.name : `${c.name} (${t('common.inactive').toLowerCase()})`}
              icon={categoryIcon(c.name)}
              selected={categoryId === c.id}
              onPress={() => edit('category_id', setCategoryId)(c.id)}
            />
          ))}
        </View>
        {errors.category_id ? <Text style={styles.error}>{errors.category_id}</Text> : null}

        <Text style={[styles.label, { marginTop: 14 }]}>{t('common.brand')}</Text>
        <View style={styles.chips}>
          {(brands.data ?? []).map((b) => (
            <Chip key={b.id} label={b.name} selected={brandId === b.id} onPress={() => edit('brand_id', setBrandId)(b.id)} />
          ))}
        </View>
        {errors.brand_id ? <Text style={styles.error}>{errors.brand_id}</Text> : null}

        <Button title={t('common.save')} onPress={submit} loading={save.isPending} style={{ marginTop: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: font.semibold, color: '#4A5468', marginBottom: 8 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 18,
  },
  imageBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md },
  imageBtn: { position: 'absolute', right: 20, bottom: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
