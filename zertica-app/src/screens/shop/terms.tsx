import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { supportApi } from '@/api/commerce';
import { Button } from '@/components/button';
import { MenuCard } from '@/components/menu-card';
import { Notice } from '@/components/notice';
import { SubpageHeader } from '@/components/screen-header';
import { TERMS, type TermsDocId } from '@/content/terms';
import { useI18n } from '@/i18n';
import { confirmAction } from '@/lib/confirm';
import { shortDate } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius, shadow } from '@/theme';

/** Pantalla "Términos y privacidad" de Figma. */
export function TermsScreen() {
  const { t, language, errorMessage } = useI18n();
  const { user } = useAuth();
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  /** No se borran datos (RN07): se envía la solicitud al equipo de soporte. */
  const requestDeletion = async () => {
    const ok = await confirmAction(t('terms.deleteTitle'), t('terms.deleteBody'), t('common.confirm'), t('common.cancel'), true);
    if (!ok) return;
    setSending(true);
    try {
      await supportApi.send(`[Solicitud de eliminación de cuenta] Usuario @${user?.username} (${user?.email}).`);
      setNotice({ tone: 'success', text: t('terms.deleteSent') });
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.flex}>
      <SubpageHeader context={t('profile.title')} contextSubtitle={user?.fullName} title={t('terms.title')} />
      <ScrollView contentContainerStyle={styles.body}>
        {TERMS.map((d) => (
          <MenuCard
            key={d.id}
            emoji={d.emoji}
            title={d.title[language]}
            subtitle={d.id === 'returns' ? t('terms.returnsSub') : t('terms.updated', { date: shortDate(d.updated, language) })}
            onPress={() => router.push({ pathname: '/terms/[doc]', params: { doc: d.id } })}
          />
        ))}
        <View style={styles.card}>
          <Text style={styles.title}>{t('terms.version')}</Text>
          <Text style={styles.muted}>Zertica Drywall Shop v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.muted}>{t('terms.copyright')}</Text>
        </View>
        {notice ? <Notice tone={notice.tone} message={notice.text} /> : null}
        <Button title={t('terms.deleteAccount')} variant="danger" onPress={requestDeletion} loading={sending} />
      </ScrollView>
    </View>
  );
}

export function TermsDocScreen({ doc }: { doc: TermsDocId }) {
  const { t, language } = useI18n();
  const d = TERMS.find((x) => x.id === doc) ?? TERMS[0];
  return (
    <View style={styles.flex}>
      <SubpageHeader context={t('terms.title')} title={d.title[language]} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.muted}>{t('terms.updated', { date: shortDate(d.updated, language) })}</Text>
          {d.body[language].map((p) => (
            <Text key={p} style={styles.p}>
              {p}
            </Text>
          ))}
        </View>
        <Notice tone="info" message={t('terms.academic')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 4, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 8, marginBottom: 12, ...shadow.card },
  title: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  p: { fontSize: 15, color: colors.textBody, lineHeight: 23 },
});
