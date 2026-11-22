import { useLocalSearchParams } from 'expo-router';
import { OrderDetailScreen } from '@/screens/shop/order-detail';

export default function AdminOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen id={Number(id) || 0} admin />;
}
