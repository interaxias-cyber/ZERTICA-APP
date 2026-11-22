import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon(props: ComponentProps<typeof MaterialCommunityIcons>) {
  return <MaterialCommunityIcons size={22} {...props} />;
}

/** Ícono por categoría según su nombre (construcción en seco). */
export function categoryIcon(name: string): IconName {
  const n = name.toLowerCase();
  if (n.includes('placa') || n.includes('panel') || n.includes('board')) return 'view-grid-outline';
  if (n.includes('perfil') || n.includes('profile') || n.includes('stud')) return 'ruler';
  if (n.includes('tornill') || n.includes('fij') || n.includes('screw')) return 'screw-flat-top';
  if (n.includes('masilla') || n.includes('acabado') || n.includes('compound')) return 'format-paint';
  if (n.includes('accesor') || n.includes('herram')) return 'toolbox-outline';
  return 'shape-outline';
}
