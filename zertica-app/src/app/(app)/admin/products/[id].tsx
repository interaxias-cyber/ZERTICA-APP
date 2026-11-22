import { useLocalSearchParams } from 'expo-router';
import { ProductFormScreen } from '@/screens/admin/product-form';

/** /admin/products/new → alta; /admin/products/:id → edición. */
export default function AdminProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductFormScreen key={id} id={id === 'new' ? null : Number(id) || null} />;
}
