import { useLocalSearchParams } from 'expo-router';
import { useCategories } from '@/hooks/use-catalog';
import { ProductBrowser } from '@/screens/catalog/product-browser';

/** CU-13 Consultar productos por categoría. */
export default function CategoryRoute() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const categories = useCategories();
  const categoryId = Number(id) || 0;
  const categoryName = name ?? categories.data?.find((c) => c.id === categoryId)?.name ?? '';
  return <ProductBrowser key={categoryId} mode="category" fixedCategory={{ id: categoryId, name: categoryName }} />;
}
