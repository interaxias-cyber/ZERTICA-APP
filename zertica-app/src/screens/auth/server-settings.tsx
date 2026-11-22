import { router } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { DEFAULT_API_URL, getApiUrl, normalizeApiUrl, REQUEST_TIMEOUT_MS, setApiUrlOverride } from '@/config/env';
import { useI18n } from '@/i18n';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { AuthShell } from './auth-shell';

/**
 * Configura la dirección del backend desde el teléfono (APK instalado):
 * se escribe la IP del PC que ejecuta el backend y se prueba GET /api/health.
 */
export function ServerSettingsScreen() {
  const { t } = useI18n();
  const current = getApiUrl();
  const [value, setValue] = useState(current === DEFAULT_API_URL ? '' : current);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>({
    tone: 'info',
    text: t('server.current', { url: current }),
  });

  const target = value.trim() ? normalizeApiUrl(value) : DEFAULT_API_URL;

  const test = async () => {
    setTesting(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, 8000));
    try {
      const res = await fetch(`${target}/health`, { signal: controller.signal });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.database === 'up') setNotice({ tone: 'success', text: t('server.ok') });
      else if (body?.status) setNotice({ tone: 'error', text: t('server.dbDown') });
      else setNotice({ tone: 'error', text: t('server.fail', { url: target }) });
      return res.ok;
    } catch {
      setNotice({ tone: 'error', text: t('server.fail', { url: target }) });
      return false;
    } finally {
      clearTimeout(timer);
      setTesting(false);
    }
  };

  const save = async () => {
    const url = value.trim() ? normalizeApiUrl(value) : null;
    setApiUrlOverride(url);
    if (url) await storage.set(STORAGE_KEYS.apiUrl, url);
    else await storage.remove(STORAGE_KEYS.apiUrl);
    router.back();
  };

  const reset = async () => {
    setValue('');
    setApiUrlOverride(null);
    await storage.remove(STORAGE_KEYS.apiUrl);
    setNotice({ tone: 'info', text: t('server.current', { url: DEFAULT_API_URL }) });
  };

  return (
    <AuthShell title={t('server.title')} subtitle={t('server.subtitle')} back compact>
      {notice ? <Notice tone={notice.tone} message={notice.text} /> : null}
      <TextField
        label={t('server.label')}
        placeholder={t('server.placeholder')}
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        hint={`${t('server.hint')}\n→ ${target}`}
        testID="server-url"
      />
      <Button title={t('server.test')} variant="secondary" onPress={test} loading={testing} testID="server-test" />
      <Button title={t('server.save')} onPress={save} style={{ marginTop: 12 }} testID="server-save" />
      <Button title={t('server.reset')} variant="ghost" onPress={reset} style={{ marginTop: 8 }} />
    </AuthShell>
  );
}
