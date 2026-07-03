import type { PropsWithChildren } from 'react';

// Native twin of SeoHead: SEO meta tags have no meaning in the app, and mounting
// expo-router/head here would activate Apple Handoff (which we don't use) and alert
// about a missing `origin` config. Render nothing.
export default function SeoHead(_props: PropsWithChildren): null {
  return null;
}
