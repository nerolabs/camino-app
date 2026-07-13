import { Redirect } from 'expo-router';

// C10a: /guides (plural) → /guide. The app links to the singular /guide everywhere; this catches
// typed or external plural URLs so they land on the index instead of the 404.
export default function GuidesRedirect() {
  return <Redirect href="/guide" />;
}
