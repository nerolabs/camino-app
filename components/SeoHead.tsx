// Web-only <Head> for SEO meta (title/description/canonical), statically prerendered.
// The .native twin renders nothing: expo-router/head on iOS is the Apple Handoff
// integration, which demands an `origin` in the app config and pops a scary Alert
// without one (build-19 device finding). We only ever wanted the web meta tags.
export { default } from 'expo-router/head';
