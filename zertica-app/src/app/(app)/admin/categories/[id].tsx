import { useLocalSearchParams } from 'expo-router';
import { CategoryFormScreen } from '@/screens/admin/category-form';

export default function AdminCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryFormScreen key={id} id={id === 'new' ? null : Number(id) || null} />;
}
