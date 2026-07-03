import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import SignInButtons from '@/components/SignInButtons';

// Two nav layouts, split on viewport width (not platform — an iPad web/native view earns the
// full bar; a narrow desktop window earns the burger):
//   • wide (≥768px): logo + inline links, as before.
//   • compact: logo + [Sign in] + CTA + ☰. Browse links (Home / How it works / Sample plan —
//     and, later, the SEO content sections) live in the burger menu; actions stay on the bar.
const WIDE = 768;

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < WIDE;
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path: string) => { setMenuOpen(false); router.push(path as never); };

  const browseLinks = (
    <>
      <MenuLink label="Home" onPress={() => go('/')} compact={compact} />
      <MenuLink label="How it works" onPress={() => go('/how-it-works')} compact={compact} />
      {/* The payoff before the ask — visible to visitors who haven't committed yet. */}
      {!user && <MenuLink label="Sample plan" onPress={() => go('/sample-plan')} compact={compact} />}
    </>
  );

  return (
    // Top safe-area (Dynamic Island / notch) is handled by the ROOT layout's SafeAreaView —
    // padding here too would double-pad, and only root-level clipping stops SCROLLED content
    // sliding under the island. Left/right insets still matter in landscape.
    <View style={[styles.nav, { paddingTop: 18, paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right }]}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.logo}>{compact ? 'Camino' : 'Camino: Your Road to Spain'}</Text>
      </TouchableOpacity>

      <View style={styles.right}>
        {!compact && browseLinks}

        {user ? (
          <>
            <TouchableOpacity onPress={() => router.push('/plan')} style={styles.cta}>
              <Text style={styles.ctaText}>My roadmap</Text>
            </TouchableOpacity>
            {!compact && (
              <TouchableOpacity onPress={signOut} style={styles.ghost}>
                <Text style={styles.ghostText}>Sign out</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* Platform-split: web = Google; iOS = dialog with Apple + Google (guideline 4.8). */}
            <SignInButtons />
            <TouchableOpacity onPress={() => router.push('/interview')} style={styles.cta}>
              <Text style={styles.ctaText}>Get your roadmap</Text>
            </TouchableOpacity>
          </>
        )}

        {compact && (
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.burger} accessibilityLabel="Menu">
            <Text style={styles.burgerText}>☰</Text>
          </TouchableOpacity>
        )}
      </View>

      {compact && (
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
            <Pressable style={[styles.menu, { marginTop: 12 + insets.top, marginRight: 16 + insets.right }]} onPress={() => {}}>
              {browseLinks}
              {user && (
                <>
                  <View style={styles.menuDivider} />
                  <MenuLink label="Sign out" onPress={() => { setMenuOpen(false); signOut(); }} compact />
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

function MenuLink({ label, onPress, compact }: { label: string; onPress: () => void; compact: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={compact ? styles.menuItem : styles.ghost}>
      <Text style={compact ? styles.menuItemText : styles.ghostText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nav:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 18, backgroundColor: palette.cal, flexWrap: 'wrap', gap: 8, borderBottomWidth: 1, borderBottomColor: '#E8E4DC' },
  logo:         { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.indigo },
  right:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cta:          { backgroundColor: palette.cobalt, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  ctaText:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cal },
  ghost:        { paddingVertical: 8, paddingHorizontal: 10 },
  ghostText:    { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.cobalt },

  burger:       { paddingVertical: 6, paddingHorizontal: 8 },
  burgerText:   { fontSize: 22, color: palette.indigo, lineHeight: 26 },
  overlay:      { flex: 1, backgroundColor: 'rgba(21,36,59,0.35)', alignItems: 'flex-end' },
  menu:         { backgroundColor: palette.cal, borderRadius: 14, paddingVertical: 8, minWidth: 220, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  menuItem:     { paddingVertical: 13, paddingHorizontal: 20 },
  menuItemText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 16, color: palette.indigo },
  menuDivider:  { height: 1, backgroundColor: '#E8E4DC', marginVertical: 4 },
});
