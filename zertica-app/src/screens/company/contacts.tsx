import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { useContacts } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { showMessage } from '@/lib/confirm';
import { colors, font, radius, shadow } from '@/theme';
import { CompanyHeader } from './company-header';

const digits = (phone: string) => phone.replace(/\D/g, '');

async function open(url: string, fallbackTitle: string) {
  try {
    await Linking.openURL(url);
  } catch {
    showMessage(fallbackTitle, url);
  }
}

/** Pantalla "Mis Contactos" de Figma: llamar o escribir por WhatsApp al equipo de cuenta. */
export function ContactsScreen() {
  const { t } = useI18n();
  const query = useContacts();
  const first = query.data?.[0];

  return (
    <View style={styles.flex}>
      <CompanyHeader
        title={t('company.contactsTitle')}
        subtitle={t('company.contactsSubtitle')}
        actions={first ? <HeaderIconButton emoji="📞" label={t('company.call')} onPress={() => open(`tel:${digits(first.phone)}`, t('company.call'))} /> : undefined}
      />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.help}>
            <Text style={styles.helpTitle}>{t('company.helpTitle')}</Text>
            <Text style={styles.helpBody}>{t('company.helpBody')}</Text>
          </View>
          {query.data.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.top}>
                <Avatar name={c.fullName.replace(/^(Arq|Ing|Lic)\.\s*/, '')} size={56} tone="navy" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.fullName}</Text>
                  <Text style={styles.title}>{c.title}</Text>
                  <Text style={styles.phone}>{c.phone}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Button title={`📞  ${t('company.call')}`} variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => open(`tel:${digits(c.phone)}`, t('company.call'))} />
                <Button
                  title={`💬  ${t('company.whatsapp')}`}
                  size="sm"
                  style={[{ flex: 1 }, styles.wa]}
                  onPress={() => open(`https://wa.me/${digits(c.phone)}`, t('company.whatsapp'))}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 14, paddingBottom: 30 },
  help: { backgroundColor: colors.orange, borderRadius: radius.lg, padding: 18 },
  helpTitle: { color: colors.white, fontSize: 18, fontWeight: font.heavy },
  helpBody: { color: colors.white, fontSize: 14, marginTop: 4, opacity: 0.95 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 14, ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 17, fontWeight: font.heavy, color: colors.text },
  title: { fontSize: 14, color: colors.textMuted },
  phone: { fontSize: 15, color: colors.orange, fontWeight: font.semibold, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  wa: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
});
