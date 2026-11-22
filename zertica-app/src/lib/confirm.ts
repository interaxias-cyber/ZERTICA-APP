import { Alert, Platform } from 'react-native';

/** Confirmación nativa (Android/iOS) o del navegador (vista previa web). */
export function confirmAction(title: string, message: string, confirmLabel: string, cancelLabel: string, destructive = false) {
  return new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web') {
      resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
      return;
    }
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function showMessage(title: string, message?: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
