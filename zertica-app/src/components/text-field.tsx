import { forwardRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, font, radius } from '@/theme';
import { Icon, type IconName } from './icon';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  secure?: boolean;
}

export const TextField = forwardRef<ComponentRef<typeof TextInput>, Props>(function TextField(
  { label, error, hint, icon, secure, style, multiline, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          focused && styles.focused,
          !!error && styles.errorBox,
        ]}>
        {icon ? <Icon name={icon} size={20} color={focused ? colors.orange : colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#A3ABB9"
          style={[styles.input, multiline && styles.inputMultiline, style]}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          accessibilityLabel={label}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityRole="button">
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: font.semibold, color: '#4A5468', marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  focused: { borderColor: colors.orange },
  errorBox: { borderColor: colors.danger },
  input: { ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null), flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10 },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top', paddingVertical: 0 },
  error: { color: colors.danger, fontSize: 12, marginTop: 5 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
});
