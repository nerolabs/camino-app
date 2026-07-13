import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { palette } from '@/constants/Colors';
import { CHANGELOG } from '@/core/changelog';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// The public regulatory changelog (TODO item 22, shipped 2026-07-12): the dated record of
// catalog corrections and verification passes, rendered straight from core/changelog.ts.
// This page IS the correction process made visible — fix fast, publish the diff, never
// argue. English-only for now (like the homework pages); the catalog content it describes
// is fully localized.

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export default function Changelog() {
  // C10a: never surface a pre-dated (future) entry before its day — ISO dates sort lexically, so
  // a simple string compare against today keeps the public log honest about what's actually live.
  const today = new Date().toISOString().slice(0, 10);
  const entries = CHANGELOG.filter(e => e.date <= today);
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Seo
        title="Regulatory changelog | Get Camino"
        description="Every correction and verification pass on Get Camino's relocation catalog, dated and in plain language. Rules change; we say so."
        canonical="https://getcamino.app/changelog"
      />
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.eyebrow}>RULES CHANGE. WE SAY SO.</Text>
        <Text style={styles.title} accessibilityRole="header">Changelog</Text>
        <Text style={styles.dek}>
          Every step in Get Camino is built from official sources — and when a rule changes,
          a source moves, or we simply got something wrong, we fix it and record it here.
          Each step also carries its own “last verified” date.
        </Text>
        <View style={styles.rule} />

        {entries.map(entry => (
          <View key={entry.date + entry.title} style={styles.entry}>
            <Text style={styles.date}>{prettyDate(entry.date)}</Text>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            {entry.details.map((d, i) => (
              <Text key={i} style={styles.detail}>• {d}</Text>
            ))}
            {entry.ids?.length ? (
              <View style={styles.idRow}>
                {entry.ids.map(id => (
                  <Link key={id} href={`/guide/${id}` as never} style={styles.idLink}>
                    {id} →
                  </Link>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.rule} />
        <Text style={styles.footerNote}>
          Spotted something out of date? Tell us — every report makes the roadmap better.
        </Text>
        <Link href="/contact" style={styles.contactLink}>Report a correction →</Link>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: palette.cal },
  scroll:      { paddingBottom: 0 },
  column:      { alignSelf: 'center', width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 64 },
  eyebrow:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, marginBottom: 14 },
  title:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 40, lineHeight: 46, color: palette.indigo, marginBottom: 16 },
  dek:         { fontFamily: 'HankenGrotesk_400Regular', fontSize: 18, lineHeight: 28, color: palette.muted },
  rule:        { height: 2, width: 48, backgroundColor: palette.amber, marginVertical: 32, borderRadius: 2 },
  entry:       { marginBottom: 30 },
  date:        { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 1, color: palette.muted, textTransform: 'uppercase', marginBottom: 4 },
  entryTitle:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, lineHeight: 28, color: palette.cobalt, marginBottom: 8 },
  detail:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 24, color: palette.indigo, marginBottom: 6 },
  idRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  idLink:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.cobalt },
  footerNote:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 24, color: palette.muted },
  contactLink: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt, marginTop: 8 },
});
