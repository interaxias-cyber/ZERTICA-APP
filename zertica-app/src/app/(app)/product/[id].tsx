import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/screens/catalog/product-detail';

export default function ProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen id={Number(id) || 0} />;
}
