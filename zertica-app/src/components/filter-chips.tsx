import { ScrollView, StyleSheet } from 'react-native';
import type { StatusFilter } from '@/api/types';
import { useI18n } from '@/i18n';
import { Chip } from './chip';

/** Filtro Todos / Activos / Inactivos con el estilo de chips del catálogo. */
export function StatusChips({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const { t } = useI18n();
  const options: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'active', label: t('common.activePlural') },
    { value: 'inactive', label: t('common.inactivePlural') },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: 8 } });
