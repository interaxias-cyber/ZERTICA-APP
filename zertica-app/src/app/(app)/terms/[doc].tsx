import { useLocalSearchParams } from 'expo-router';
import type { TermsDocId } from '@/content/terms';
import { TermsDocScreen } from '@/screens/shop/terms';

export default function TermsDocRoute() {
  const { doc } = useLocalSearchParams<{ doc: TermsDocId }>();
  return <TermsDocScreen doc={doc} />;
}
