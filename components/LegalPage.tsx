import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// Shared frame for the legal pages (privacy / terms / aviso legal): same brand, plain
// language, one obvious "last updated" date. Content is data so the pages stay skimmable.

export type LegalSection = { h?: string; body: string[] };

export default function LegalPage({ title, metaTitle, description, canonical, updated, intro, sections }: {
  title: string; metaTitle: string; description: string; canonical: string;
  updated: string; intro?: string; sections: LegalSection[];
}) {
  return (
    <ScrollView style={styles.scroll}>
      <Seo title={metaTitle} description={description} canonical={canonical} />
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Last updated: {updated}</Text>
        {intro && <Text style={styles.intro}>{intro}</Text>}
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.h && <Text style={styles.h}>{s.h}</Text>}
            {s.body.map((p, j) => <Text key={j} style={styles.p}>{p}</Text>)}
          </View>
        ))}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: palette.cal },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 40, color: palette.indigo, marginBottom: 6 },
  updated: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted, marginBottom: 18 },
  intro:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 25, color: palette.indigo, marginBottom: 22 },
  section: { marginBottom: 22 },
  h:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 27, color: palette.cobalt, marginBottom: 8 },
  p:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: palette.indigo, marginBottom: 10 },
});
