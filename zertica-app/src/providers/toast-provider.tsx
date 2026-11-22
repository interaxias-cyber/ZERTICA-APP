import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius } from '@/theme';

type Tone = 'success' | 'error';
const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

/** Aviso breve en la parte inferior (p. ej. "Agregado al carrito"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, tone: Tone = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + 88 }]} accessibilityLiveRegion="polite">
          <View style={[styles.toast, toast.tone === 'error' && styles.error]}>
            <Text style={styles.text}>
              {toast.tone === 'success' ? '✓ ' : '! '}
              {toast.message}
            </Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12, maxWidth: 420 },
  error: { backgroundColor: colors.dangerSolid },
  text: { color: colors.white, fontWeight: font.semibold, fontSize: 14 },
});
