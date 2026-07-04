import LegalPage from '@/components/LegalPage';

// Plain-language privacy policy. DRAFTED BY THE BUILD ASSISTANT, REVIEWED BY THE OPERATOR —
// not legal advice to ourselves either; a professional review is on the pre-launch list.
// Keep in sync with reality: if a processor is added or a data flow changes, this page
// changes in the same PR (same discipline as the homework pages).

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      metaTitle="Privacy policy | Get Camino"
      description="What Get Camino collects, why, where it goes, and how to delete it — in plain language."
      canonical="https://getcamino.app/privacy"
      updated="4 July 2026"
      intro="The short version: we collect your email and your interview answers so we can build and save your roadmap and send you the emails you asked for. We don't sell data, we don't run ads, we don't want your documents, and you can delete everything yourself, in the app, at any time."
      sections={[
        { h: 'Who we are', body: [
          'Get Camino (getcamino.app) is operated by AELaboratories, Inc, 500 Westover Dr #34489, Sanford, NC 27330, United States.',
          'Questions or requests about your data: use "Report a problem" in the app menu, or email privacy@getcamino.app.',
        ]},
        { h: 'What we collect', body: [
          'Account: your email address and a sign-in identifier (from Apple, Google, or the email code you use to sign in).',
          'Your answers: what you tell Lola in the interview — nationalities, family situation, work situation, an income band, rough dates, and plans like driving, schooling, buying property, or pets. This is what your roadmap is computed from.',
          'Progress and preferences: which steps you\'ve marked done (and on which dates), and email preferences like unsubscribing from the weekly roundup.',
          'Feedback: whatever you type into "Report a problem", plus basic context (platform, app version, which screen).',
          'Technical: error reports (so we can fix crashes) and product analytics (which screens are used). On the web our analytics are cookieless — nothing is stored on your device to track you across visits.',
        ]},
        { h: 'What we deliberately do not collect', body: [
          'No document uploads — we\'ve chosen not to be a store of passports and certificates.',
          'No payment details (Get Camino is free), no precise location, no advertising identifiers, no data sales to anyone, ever.',
        ]},
        { h: 'How AI is involved', body: [
          'Lola\'s conversation runs on Anthropic\'s Claude: the text you type in the interview and in step conversations is processed to phrase questions and understand answers. Which steps apply to you, and every date, is computed by our own deterministic engine — not by AI.',
          'Lola\'s voice is synthesized by ElevenLabs from Lola\'s own lines. Your text is not sent to ElevenLabs.',
        ]},
        { h: 'Who processes data for us', body: [
          'Supabase (accounts and database), Resend (sending email, EU region), PostHog (analytics, EU region, cookieless on web), Sentry (error reporting), Anthropic (conversation processing), ElevenLabs (voice), and Expo/EAS Hosting with Cloudflare (hosting). Some of these providers process data in the United States.',
        ]},
        { h: 'Emails', body: [
          'We send transactional email (sign-in links, a one-time welcome) and a weekly roundup of what\'s due on your roadmap. The roundup has one-click unsubscribe; it also simply stops when there\'s nothing useful to say.',
        ]},
        { h: 'Retention and deletion', body: [
          'We keep your data while you have an account. Delete your account any time in the app: menu → Delete my account. This immediately and permanently removes your account, your answers, and your roadmap. Emails already sent to you obviously remain in your inbox.',
        ]},
        { h: 'Your rights', body: [
          'You can access what we hold (it\'s essentially your interview answers — visible in the app), correct it (tell Lola what changed), delete it (in-app), and complain to your local data-protection authority if we\'ve let you down. EU/EEA residents have these rights under the GDPR; we honor them for everyone.',
        ]},
        { h: 'Changes', body: [
          'If this policy changes materially, we\'ll note it here with a new date. The version history is public in our repository.',
        ]},
      ]}
    />
  );
}
