import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { supabase } from '@/core/supabase';
import { useWide } from '@/lib/useWide';
import { SUPPORTED_LOCALES, setAppLocale, type LocaleCode } from '@/lib/i18n';
import SignInButtons from '@/components/SignInButtons';

// One nav for every width (user decision 2026-07-03: desktop gets the burger too — parity with
// mobile, and Sign out declutters into the menu). Actions stay on the bar (Sign in / CTA / ☰);
// browsing (Home / How it works / Sample plan — and, later, the SEO content sections) plus
// Sign out live in the burger menu. Only the logo text responds to width — via useWide, whose
// SSR default matches the first client render (raw useWindowDimensions here made the server
// and client disagree on the wordmark TEXT → React hydration error #418 on every page,
// caught by the Playwright error tracker 2026-07-04).

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const wide = useWide();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const go = (path: string) => { setMenuOpen(false); router.push(path as never); };

  const pathname = usePathname();
  const currentLocale = SUPPORTED_LOCALES.find(l => l.code === i18n.language) ?? SUPPORTED_LOCALES[0];
  const chooseLocale = (code: LocaleCode) => {
    setLangOpen(false);
    setAppLocale(code);
    // Signed-in users carry the choice in auth metadata so emails can match the app language
    // (design §3; the weekly engine already reads user_metadata for its bookkeeping).
    if (user) supabase.auth.updateUser({ data: { lang: code } }).catch(() => {});
    // On a locale-prefixed web route (/es/…, L2 tree) the URL owns the language, so switching
    // NAVIGATES to the chosen variant — otherwise the root layout would snap right back.
    const prefixed = SUPPORTED_LOCALES.find(l => l.code !== 'en' && (pathname === `/${l.code}` || pathname?.startsWith(`/${l.code}/`)));
    if (prefixed && code !== prefixed.code) {
      const rest = pathname === `/${prefixed.code}` ? '/' : pathname!.slice(prefixed.code.length + 1);
      router.replace((code === 'en' ? rest : `/${code}${rest === '/' ? '' : rest}`) as never);
    }
  };

  return (
    // Top safe-area (Dynamic Island / notch) is handled by the ROOT layout's SafeAreaView —
    // padding here too would double-pad, and only root-level clipping stops SCROLLED content
    // sliding under the island. Left/right insets still matter in landscape.
    <View style={[styles.nav, { paddingTop: 18, paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right }]}>
      {/* Bar text caps its Dynamic Type scaling (maxFontSizeMultiplier) and never wraps:
          at large accessibility text sizes the labels outgrew the row and the bar stacked
          into two ugly lines (build-24 family finding — same phone, larger text setting).
          The MENU items stay fully scalable; only the one-line bar is capped. */}
      <TouchableOpacity onPress={() => router.push('/')} style={styles.logoWrap} accessibilityRole="link" accessibilityLabel={t('nav.homeA11y')}>
        <Text style={styles.logo} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {wide ? t('nav.wordmarkWide') : t('nav.wordmark')}
        </Text>
      </TouchableOpacity>

      <View style={styles.right}>
        {user ? (
          <TouchableOpacity onPress={() => router.push('/plan')} style={styles.cta}>
            <Text style={styles.ctaText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('nav.myRoadmap')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Platform-split: web = Google; iOS = dialog with Apple + Google (guideline 4.8). */}
            <SignInButtons />
            <TouchableOpacity onPress={() => router.push('/interview')} style={styles.cta}>
              <Text style={styles.ctaText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('nav.getYourRoadmap')}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.burger} accessibilityLabel={t('nav.menuA11y')} accessibilityRole="button">
          <Text style={styles.burgerText} maxFontSizeMultiplier={1.2}>☰</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menu, { marginTop: 12 + insets.top, marginRight: 16 + insets.right }]} onPress={() => {}}>
            <MenuLink label={t('nav.menu.home')} onPress={() => go('/')} />
            {/* how-it-works was merged into the landing story (landing v2, 2026-07-10) — the old
                route just redirects home, so it earns no menu item. */}
            <MenuLink label={t('nav.menu.guides')} onPress={() => go('/guide')} />
            {/* The payoff before the ask — for everyone (user request 2026-07-04: it used to
                hide when signed in, which read as it vanishing). */}
            <MenuLink label={t('nav.menu.samplePlan')} onPress={() => go('/sample-plan')} />
            {/* The build story (essay/log/roadmap) is English-ONLY by decision — its audience is
                the builder's English-speaking professional network. So the menu item is hidden in
                the other languages rather than linking their readers to an English page. */}
            {i18n.language === 'en' && (
              <MenuLink label={t('nav.menu.howIWasBuilt')} onPress={() => go('/how-i-was-built')} />
            )}
            <View style={styles.menuDivider} />
            {/* The switcher is a FEATURE, not a buried setting (user requirement, LOCALIZATION.md
                §10): always visible, current language shown by its own name. */}
            <MenuLink label={t('language.current', { name: currentLocale.name })} onPress={() => { setMenuOpen(false); setLangOpen(true); }} />
            {/* Subtle but always at hand — one tap from anywhere (user request 2026-07-03). */}
            {/* Kept as its own menu item (user decision 2026-07-11), but it now rides the
                general contact page with the problem topic pre-selected. */}
            <MenuLink label={t('nav.menu.reportProblem')} onPress={() => go('/contact?topic=problem')} />
            {/* Phase 6 #27: sign out + delete now live on the account page (user 2026-07-13), so
                the menu carries just the one link to it. Apple 5.1.1(v) — deletion stays in-app. */}
            {user && (
              <MenuLink label={t('nav.menu.account')} onPress={() => go('/account')} />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Each option in its OWN language (Español, not Spanish) — more join at L1/L3. */}
      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setLangOpen(false)}>
          <Pressable style={[styles.menu, { marginTop: 12 + insets.top, marginRight: 16 + insets.right }]} onPress={() => {}}>
            <Text style={styles.menuHeading} accessibilityRole="header">{t('language.title')}</Text>
            {SUPPORTED_LOCALES.map(l => (
              <TouchableOpacity
                key={l.code}
                onPress={() => chooseLocale(l.code)}
                style={styles.menuItem}
                accessibilityRole="button"
                accessibilityState={{ selected: l.code === currentLocale.code }}
              >
                <Text style={styles.menuItemText}>
                  {l.code === currentLocale.code ? `✓ ${l.name}` : l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

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
  menuHeading:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.muted, paddingVertical: 10, paddingHorizontal: 20, textTransform: 'uppercase', letterSpacing: 0.6 },
  menuDivider:  { height: 1, backgroundColor: '#E8E4DC', marginVertical: 4 },
});
