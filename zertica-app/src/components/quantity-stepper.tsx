import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, radius } from '@/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
  label?: string;
}

/** Selector − / cantidad / + con el estilo del diseño. */
export function QuantityStepper({ value, onChange, max = 99999, min = 1, disabled, label }: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <View style={[styles.wrap, disabled && { opacity: 0.5 }]} accessibilityLabel={label}>
      <Pressable
        style={styles.btn}
        onPress={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        accessibilityRole="button"
        accessibilityLabel="−">
        <Text style={[styles.sign, value <= min && styles.signOff]}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={styles.btn}
        onPress={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        accessibilityRole="button"
        accessibilityLabel="+">
        <Text style={[styles.sign, value >= max && styles.signOff]}>+</Text>
      </Pressable>
    </View>
  );
}

/** Caja numérica editable (pedido masivo): "0  u." como en Figma. */
export function QuantityBox({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max: number; label: string }) {
  const [text, setText] = useState(value ? String(value) : '');
  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const n = digits ? Math.min(Number(digits), max) : 0;
    setText(n ? String(n) : '');
    onChange(n);
  };
  return (
    <TextInput
      value={text}
      onChangeText={(t) => {
        setText(t.replace(/\D/g, ''));
        commit(t);
      }}
      keyboardType="number-pad"
      placeholder="0"
      placeholderTextColor="#9CA3AF"
      style={styles.box}
      maxLength={6}
      accessibilityLabel={label}
      selectTextOnFocus
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chip,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sign: { fontSize: 20, fontWeight: font.bold, color: colors.orange },
  signOff: { color: '#C4C8D0' },
  value: { minWidth: 30, textAlign: 'center', fontSize: 15, fontWeight: font.bold, color: colors.text },
  box: {
    width: 74,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: font.bold,
    color: colors.text,
  },
});
