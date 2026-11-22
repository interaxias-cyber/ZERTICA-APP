import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/avatar';
import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';

/** Encabezado del portal Empresa (Figma): iniciales en azul, título y engrane a "Cuenta". */
export function CompanyHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      leadingNode={<Avatar name={user?.fullName ?? 'CX'} size={40} shape="rounded" tone="navy" />}
      right={
        <>
          {actions}
          <HeaderIconButton emoji="⚙️" label={t('tabs.companyAccount')} onPress={() => router.navigate('/company/account')} />
        </>
      }
    />
  );
}
