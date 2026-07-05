import LegalPage, { type LegalContent } from '@/components/LegalPage';

// Plain-language terms. DRAFT for operator review (and eventually a professional pass) —
// the substance mirrors what the product already says everywhere: guidance, not advice.
// The ES version is a courtesy translation and says so — English prevails.

const EN: LegalContent = {
  title: 'Terms of use',
  updated: '4 July 2026',
  intro: "The short version: Get Camino organizes your move and points at official sources, but it isn't a law firm, a gestoría, or a tax adviser — and rules change. Use it as your map; confirm the specifics for your case before acting on them.",
  sections: [
    { h: 'What Get Camino is (and isn\'t)', body: [
      'Get Camino turns your answers into a sequenced plan for moving to Spain, with official steps citing government sources. It is general guidance — not legal, tax, or immigration advice, and using it doesn\'t create any professional-client relationship.',
      'Lola keeps the map; a gestor signs the papers. For decisions with legal or financial consequences, verify against the linked official source or a qualified professional.',
    ]},
    { h: 'Accuracy', body: [
      'We source official steps against government publications and record when they were verified — and rules still change, sometimes quickly and by region. We don\'t warrant that any item is complete, current, or applicable to your specific case.',
    ]},
    { h: 'Your account', body: [
      'Keep your answers honest (the roadmap is only as good as its inputs). You can delete your account and data at any time in the app. We may suspend accounts that abuse the service (automated scraping, attempting to misuse the AI endpoints, or unlawful use).',
    ]},
    { h: 'Liability', body: [
      'Get Camino is provided free and "as is". To the maximum extent permitted by law, AELaboratories, Inc is not liable for indirect or consequential losses (including missed deadlines, visa outcomes, or tax consequences) arising from use of the service. Nothing in these terms excludes liability that cannot lawfully be excluded.',
    ]},
    { h: 'Intellectual property', body: [
      'The Get Camino product, brand, catalog structure and content are ours; your answers and your roadmap are yours. Official sources belong to their governments — that\'s rather the point.',
    ]},
    { h: 'Governing law', body: [
      'These terms are governed by the laws of the State of North Carolina, United States, where the operator is based. If you use Get Camino as a consumer in the EU, mandatory consumer protections of your country still apply to you.',
    ]},
    { h: 'Changes', body: [
      'We\'ll update these terms as the product grows, with the date above. Material changes will be noted in the app or by email.',
    ]},
  ],
};

const ES: LegalContent = {
  title: 'Términos de uso',
  updated: '4 de julio de 2026',
  intro: 'La versión corta: Get Camino organiza tu mudanza y señala fuentes oficiales, pero no es un bufete, una gestoría ni un asesor fiscal — y las normas cambian. Úsalo como tu mapa; confirma los detalles de tu caso antes de actuar.',
  sections: [
    { h: 'Qué es Get Camino (y qué no)', body: [
      'Get Camino convierte tus respuestas en un plan ordenado para mudarte a España, con pasos oficiales que citan fuentes del gobierno. Es orientación general — no asesoramiento legal, fiscal ni migratorio, y usarlo no crea ninguna relación profesional-cliente.',
      'Lola lleva el mapa; un gestor firma los papeles. Para decisiones con consecuencias legales o económicas, verifica contra la fuente oficial enlazada o con un profesional cualificado.',
    ]},
    { h: 'Exactitud', body: [
      'Contrastamos los pasos oficiales con publicaciones del gobierno y registramos cuándo se verificaron — y aun así las normas cambian, a veces rápido y según la región. No garantizamos que ningún elemento esté completo, vigente o sea aplicable a tu caso concreto.',
    ]},
    { h: 'Tu cuenta', body: [
      'Mantén tus respuestas honestas (la hoja de ruta vale lo que valgan sus datos). Puedes borrar tu cuenta y tus datos en cualquier momento desde la app. Podemos suspender cuentas que abusen del servicio (scraping automatizado, intentos de mal uso de los endpoints de IA o uso ilícito).',
    ]},
    { h: 'Responsabilidad', body: [
      'Get Camino se ofrece gratis y «tal cual». En la máxima medida que permita la ley, AELaboratories, Inc no responde de pérdidas indirectas o consecuenciales (incluidos plazos perdidos, resultados de visados o consecuencias fiscales) derivadas del uso del servicio. Nada en estos términos excluye responsabilidades que legalmente no puedan excluirse.',
    ]},
    { h: 'Propiedad intelectual', body: [
      'El producto Get Camino, la marca, la estructura del catálogo y el contenido son nuestros; tus respuestas y tu hoja de ruta son tuyas. Las fuentes oficiales pertenecen a sus gobiernos — esa es precisamente la idea.',
    ]},
    { h: 'Ley aplicable', body: [
      'Estos términos se rigen por las leyes del Estado de Carolina del Norte, Estados Unidos, donde tiene su sede el operador. Si usas Get Camino como consumidor en la UE, siguen aplicándote las protecciones imperativas de consumo de tu país.',
    ]},
    { h: 'Cambios', body: [
      'Actualizaremos estos términos a medida que el producto crezca, con la fecha de arriba. Los cambios sustanciales se anunciarán en la app o por correo.',
    ]},
    { h: 'Idioma', body: [
      'Esta página es una traducción por comodidad. En caso de discrepancia, prevalece la versión en inglés.',
    ]},
  ],
};

export default function TermsPage() {
  return (
    <LegalPage
      metaTitle="Terms of use | Get Camino"
      description="The deal, in plain language: Get Camino is guidance, not legal or tax advice — sourced carefully, verified by you."
      canonical="https://getcamino.app/terms"
      en={EN}
      es={ES}
    />
  );
}
