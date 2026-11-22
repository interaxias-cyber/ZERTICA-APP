import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supportApi } from '@/api/commerce';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { SubpageHeader } from '@/components/screen-header';
import { FAQ } from '@/content/help';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius, shadow } from '@/theme';

/** Pantalla "Ayuda y soporte" de Figma: preguntas frecuentes y mensaje al equipo. */
export function HelpScreen() {
  const { t, language, errorMessage } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const send = async () => {
    const text = message.trim();
    if (text.length < 10) {
      setNotice({ tone: 'error', text: t('validation.TOO_SHORT') });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      await supportApi.send(text);
      setMessage('');
      setNotice({ tone: 'success', text: t('help.sent') });
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubpageHeader
        context={t('profile.title')}
        contextSubtitle={user?.fullName}
        title={user?.role === 'company' ? t('help.companyTitle') : t('help.title')}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>{t('help.faq')}</Text>
        {FAQ[language].map((f, i) => (
          <Pressable
            key={f.q}
            onPress={() => setOpen(open === i ? null : i)}
            style={styles.card}
            accessibilityRole="button"
            accessibilityState={{ expanded: open === i }}>
            <View style={styles.qRow}>
              <Text style={styles.q}>{f.q}</Text>
              <Icon name={open === i ? 'chevron-down' : 'chevron-right'} size={22} color={colors.orange} />
            </View>
            {open === i ? <Text style={styles.a}>{f.a}</Text> : null}
          </Pressable>
        ))}
        <View style={styles.card}>
          <Text style={styles.q}>{t('help.notFound')}</Text>
          <Text style={styles.sub}>{t('help.notFoundBody')}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('help.placeholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            style={styles.textarea}
            accessibilityLabel={t('help.placeholder')}
            testID="help-message"
          />
          {notice ? <Notice tone={notice.tone} message={notice.text} /> : null}
          <Button title={t('help.send')} onPress={send} loading={sending} testID="help-send" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: font.bold, color: colors.textMuted, letterSpacing: 0.6 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 10, ...shadow.card },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  q: { flex: 1, fontSize: 16, fontWeight: font.semibold, color: colors.text },
  a: { fontSize: 14, color: colors.textBody, lineHeight: 21 },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  textarea: {
    minHeight: 96,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
