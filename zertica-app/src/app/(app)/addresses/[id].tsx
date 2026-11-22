import { useLocalSearchParams } from 'expo-router';
import { AddressFormScreen } from '@/screens/shop/addresses';

export default function AddressRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AddressFormScreen id={id === 'new' ? null : Number(id) || null} />;
}
