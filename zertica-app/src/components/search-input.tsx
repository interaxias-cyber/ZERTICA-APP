import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius } from '@/theme';
import { Icon } from './icon';

interface Props extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchInput({ value, onChangeText, ...rest }: Props) {
  return (
    <View style={styles.box}>
      <Icon name="magnify" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor="#A3ABB9"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={100}
        {...rest}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="clear">
          <Icon name="close-circle" size={18} color="#A3ABB9" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null), flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
});
