/**
 * The how-it-works content moved onto the landing page (variant C, 2026-07-10 —
 * docs/LANDING-REDESIGN.md): the three steps became a live demo in the scroll. This
 * redirect keeps old links, nav entries, and indexed URLs working.
 */
import { Redirect } from 'expo-router';

export default function HowItWorksRedirect() {
  return <Redirect href="/" />;
}
