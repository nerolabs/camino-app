import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import SignInButtons from '@/components/SignInButtons';
import FeedbackDialog from '@/components/FeedbackDialog';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

// One nav for every width (user decision 2026-07-03: desktop gets the burger too — parity with
// mobile, and Sign out declutters into the menu). Actions stay on the bar (Sign in / CTA / ☰);
// browsing (Home / How it works / Sample plan — and, later, the SEO content sections) plus
// Sign out live in the burger menu. Only the logo text responds to width.
const WIDE = 768;

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const go = (path: string) => { setMenuOpen(false); router.push(path as never); };

  return (
    // Top safe-area (Dynamic Island / notch) is handled by the ROOT layout's SafeAreaView —
    // padding here too would double-pad, and only root-level clipping stops SCROLLED content
    // sliding under the island. Left/right insets still matter in landscape.
    <View style={[styles.nav, { paddingTop: 18, paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right }]}>
      {/* Bar text caps its Dynamic Type scaling (maxFontSizeMultiplier) and never wraps:
          at large accessibility text sizes the labels outgrew the row and the bar stacked
          into two ugly lines (build-24 family finding — same phone, larger text setting).
          The MENU items stay fully scalable; only the one-line bar is capped. */}
      <TouchableOpacity onPress={() => router.push('/')} style={styles.logoWrap} accessibilityRole="link" accessibilityLabel="Get Camino home">
        <Text style={styles.logo} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {width < WIDE ? 'Get Camino' : 'Get Camino: Your Road to Spain'}
        </Text>
      </TouchableOpacity>

      <View style={styles.right}>
        {user ? (
          <TouchableOpacity onPress={() => router.push('/plan')} style={styles.cta}>
            <Text style={styles.ctaText} numberOfLines={1} maxFontSizeMultiplier={1.2}>My roadmap</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Platform-split: web = Google; iOS = dialog with Apple + Google (guideline 4.8). */}
            <SignInButtons />
            <TouchableOpacity onPress={() => router.push('/interview')} style={styles.cta}>
              <Text style={styles.ctaText} numberOfLines={1} maxFontSizeMultiplier={1.2}>Get your roadmap</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.burger} accessibilityLabel="Menu" accessibilityRole="button">
          <Text style={styles.burgerText} maxFontSizeMultiplier={1.2}>☰</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menu, { marginTop: 12 + insets.top, marginRight: 16 + insets.right }]} onPress={() => {}}>
            <MenuLink label="Home" onPress={() => go('/')} />
            <MenuLink label="How it works" onPress={() => go('/how-it-works')} />
            <MenuLink label="Guides" onPress={() => go('/guide')} />
            {/* The payoff before the ask — for everyone (user request 2026-07-04: it used to
                hide when signed in, which read as it vanishing). */}
            <MenuLink label="Sample plan" onPress={() => go('/sample-plan')} />
            {/* The build story went public 3 Jul 2026 (user decision) — essay, log, roadmap. */}
            <MenuLink label="How I was built" onPress={() => go('/how-i-was-built')} />
            <View style={styles.menuDivider} />
            {/* Subtle but always at hand — one tap from anywhere (user request 2026-07-03). */}
            <MenuLink label="Report a problem" onPress={() => { setMenuOpen(false); setFeedbackOpen(true); }} />
            {user && (
              <>
                <MenuLink label="Sign out" onPress={() => { setMenuOpen(false); signOut(); }} />
                {/* Apple 5.1.1(v): account deletion must be reachable in-app. Quiet, but here. */}
                <MenuLink label="Delete my account" onPress={() => { setMenuOpen(false); setDeleteOpen(true); }} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <FeedbackDialog visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <DeleteAccountDialog visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </View>
  );
}

function MenuLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} accessibilityRole="button">
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nav:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 18, backgroundColor: palette.cal, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E8E4DC' },
  logoWrap:     { flexShrink: 1 },
  logo:         { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.indigo },
  right:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  cta:          { backgroundColor: palette.cobalt, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  ctaText:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cal },

  burger:       { paddingVertical: 6, paddingHorizontal: 8 },
  burgerText:   { fontSize: 22, color: palette.indigo, lineHeight: 26 },
  overlay:      { flex: 1, backgroundColor: 'rgba(21,36,59,0.35)', alignItems: 'flex-end' },
  menu:         { backgroundColor: palette.cal, borderRadius: 14, paddingVertical: 8, minWidth: 220, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  menuItem:     { paddingVertical: 13, paddingHorizontal: 20 },
  menuItemText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 16, color: palette.indigo },
  menuDivider:  { height: 1, backgroundColor: '#E8E4DC', marginVertical: 4 },
});
