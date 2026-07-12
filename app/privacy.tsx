import LegalPage, { type LegalContent } from '@/components/LegalPage';

// Plain-language privacy policy. DRAFTED BY THE BUILD ASSISTANT, REVIEWED BY THE OPERATOR —
// not legal advice to ourselves either; a professional review is on the pre-launch list.
// Keep in sync with reality: if a processor is added or a data flow changes, this page
// changes in the same PR (same discipline as the homework pages). The ES version is a
// courtesy translation and says so — English prevails (LOCALIZATION.md §10; Cristina-pass
// pending like the rest of the es surface).

const EN: LegalContent = {
  title: 'Privacy',
  updated: '12 July 2026',
  intro: "The short version: we collect your email and your interview answers so we can build and save your roadmap and send you the emails you asked for. We don't sell data, we don't run ads, we don't want your documents, and you can delete everything yourself, in the app, at any time.",
  sections: [
    { h: 'Who we are', body: [
      'Get Camino (getcamino.app) is operated by AELaboratories, Inc, 500 Westover Dr #34489, Sanford, NC 27330, United States.',
      'Questions or requests about your data: use "Report a problem" in the app menu, or email privacy@getcamino.app.',
    ]},
    { h: 'What we collect', body: [
      'Account: your email address and a sign-in identifier (from Apple, Google, or the email code you use to sign in).',
      'Your answers: what you tell Lola in the interview — nationalities, family situation, work situation, an income band, rough dates, and plans like driving, schooling, buying property, or pets. This is what your roadmap is computed from.',
      'Progress and preferences: which steps you\'ve marked done (and on which dates), and email preferences like unsubscribing from the weekly roundup.',
      'Feedback: whatever you type into "Report a problem", plus basic context (platform, app version, which screen).',
      'Technical: error reports (so we can fix crashes) and product analytics — which screens are used, and some interview events include the text of the answer (it\'s how we find questions that confuse people and fix them). On the web our analytics are cookieless — nothing is stored on your device to track you across visits.',
    ]},
    { h: 'What we deliberately do not collect', body: [
      'No document uploads — we\'ve chosen not to be a store of passports and certificates.',
      'No payment details (Get Camino is free), no precise location, no advertising identifiers, no data sales to anyone, ever.',
    ]},
    { h: 'How AI is involved', body: [
      'Lola runs on Anthropic\'s Claude: the text you type in the interview and in step conversations is processed to phrase questions and understand answers. Which steps apply to you, and every date, is computed by our own deterministic engine — not by AI.',
    ]},
    { h: 'Who processes data for us', body: [
      'Supabase (accounts and database), Resend (sending email, EU region), PostHog (analytics, EU region, cookieless on web), Sentry (error reporting), Anthropic (interview processing), and Expo/EAS Hosting with Cloudflare (hosting). Some of these providers process data in the United States.',
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
  ],
};

const ES: LegalContent = {
  title: 'Privacidad',
  updated: '12 de julio de 2026',
  intro: 'La versión corta: recogemos tu correo y tus respuestas de la entrevista para construir y guardar tu hoja de ruta y enviarte los correos que pediste. No vendemos datos, no ponemos anuncios, no queremos tus documentos, y puedes borrarlo todo tú mismo, en la app, cuando quieras.',
  sections: [
    { h: 'Quiénes somos', body: [
      'Get Camino (getcamino.app) está operado por AELaboratories, Inc, 500 Westover Dr #34489, Sanford, NC 27330, Estados Unidos.',
      'Preguntas o solicitudes sobre tus datos: usa «Informar de un problema» en el menú de la app, o escribe a privacy@getcamino.app.',
    ]},
    { h: 'Qué recogemos', body: [
      'Cuenta: tu dirección de correo y un identificador de acceso (de Apple, Google o el código de correo con el que inicias sesión).',
      'Tus respuestas: lo que le cuentas a Lola en la entrevista — nacionalidades, situación familiar, situación laboral, una franja de ingresos, fechas aproximadas y planes como conducir, escolarizar, comprar vivienda o mascotas. De ahí se calcula tu hoja de ruta.',
      'Progreso y preferencias: qué pasos has marcado como hechos (y en qué fechas), y preferencias de correo como darte de baja del resumen semanal.',
      'Comentarios: lo que escribas en «Informar de un problema», más contexto básico (plataforma, versión de la app, pantalla).',
      'Técnico: informes de errores (para arreglar fallos) y analítica de producto — qué pantallas se usan, y algunos eventos de la entrevista incluyen el texto de la respuesta (así encontramos las preguntas que confunden y las arreglamos). En la web nuestra analítica es sin cookies — no se guarda nada en tu dispositivo para rastrearte entre visitas.',
    ]},
    { h: 'Lo que deliberadamente no recogemos', body: [
      'Sin subida de documentos — hemos decidido no ser un almacén de pasaportes y certificados.',
      'Sin datos de pago (Get Camino es gratis), sin ubicación precisa, sin identificadores publicitarios, sin venta de datos a nadie, nunca.',
    ]},
    { h: 'Cómo interviene la IA', body: [
      'La conversación de Lola funciona con Claude, de Anthropic: el texto que escribes en la entrevista y en las conversaciones de cada paso se procesa para formular preguntas y entender respuestas. Qué pasos te aplican, y cada fecha, lo calcula nuestro propio motor determinista — no la IA.',
    ]},
    { h: 'Quién procesa datos por nosotros', body: [
      'Supabase (cuentas y base de datos), Resend (envío de correo, región UE), PostHog (analítica, región UE, sin cookies en web), Sentry (informes de errores), Anthropic (procesamiento de la entrevista) y Expo/EAS Hosting con Cloudflare (alojamiento). Algunos de estos proveedores procesan datos en Estados Unidos.',
    ]},
    { h: 'Correos', body: [
      'Enviamos correo transaccional (enlaces de acceso, una bienvenida única) y un resumen semanal de lo que vence en tu hoja de ruta. El resumen tiene baja en un clic; y, sencillamente, deja de llegar cuando no hay nada útil que decir.',
    ]},
    { h: 'Conservación y borrado', body: [
      'Conservamos tus datos mientras tengas cuenta. Borra tu cuenta cuando quieras en la app: menú → Eliminar mi cuenta. Esto elimina de inmediato y permanentemente tu cuenta, tus respuestas y tu hoja de ruta. Los correos que ya te enviamos, obviamente, permanecen en tu bandeja.',
    ]},
    { h: 'Tus derechos', body: [
      'Puedes acceder a lo que tenemos (esencialmente tus respuestas de la entrevista — visibles en la app), corregirlo (cuéntale a Lola qué cambió), borrarlo (en la app) y reclamar ante tu autoridad de protección de datos si te hemos fallado. Los residentes de la UE/EEE tienen estos derechos bajo el RGPD; nosotros los respetamos para todo el mundo.',
    ]},
    { h: 'Cambios', body: [
      'Si esta política cambia de forma sustancial, lo anotaremos aquí con una fecha nueva. El historial de versiones es público en nuestro repositorio.',
    ]},
    { h: 'Idioma', body: [
      'Esta página es una traducción por comodidad. En caso de discrepancia, prevalece la versión en inglés.',
    ]},
  ],
};

export default function PrivacyPage() {
  return (
    <LegalPage
      metaTitle="Privacy policy | Get Camino"
      description="What Get Camino collects, why, where it goes, and how to delete it — in plain language."
      canonical="https://getcamino.app/privacy"
      en={EN}
      es={ES}
    />
  );
}
