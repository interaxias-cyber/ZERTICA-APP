import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { useI18n } from '@/i18n';

/** Encabezado del panel (Figma): inicial del administrador, título y escudo que abre "Mi cuenta". */
export function AdminHeader({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      leading="admin"
      right={
        <>
          {actions}
          <HeaderIconButton emoji="🛡️" label={t('tabs.account')} onPress={() => router.navigate('/admin/account')} />
        </>
      }>
      {children}
    </ScreenHeader>
  );
}
