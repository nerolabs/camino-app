import LegalPage from '@/components/LegalPage';

// Plain-language terms. DRAFT for operator review (and eventually a professional pass) —
// the substance mirrors what the product already says everywhere: guidance, not advice.

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      metaTitle="Terms of use | Get Camino"
      description="The deal, in plain language: Get Camino is guidance, not legal or tax advice — sourced carefully, verified by you."
      canonical="https://getcamino.app/terms"
      updated="4 July 2026"
      intro="The short version: Get Camino organizes your move and points at official sources, but it isn't a law firm, a gestoría, or a tax adviser — and rules change. Use it as your map; confirm the specifics for your case before acting on them."
      sections={[
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
          'Get Camino is provided free and "as is". To the maximum extent permitted by law, AELaboratories is not liable for indirect or consequential losses (including missed deadlines, visa outcomes, or tax consequences) arising from use of the service. Nothing in these terms excludes liability that cannot lawfully be excluded.',
        ]},
        { h: 'Intellectual property', body: [
          'The Get Camino product, brand, catalog structure and content are ours; your answers and your roadmap are yours. Official sources belong to their governments — that\'s rather the point.',
        ]},
        { h: 'Governing law', body: [
          'These terms are governed by the laws of the State of Washington, United States, where the operator is based. If you use Get Camino as a consumer in the EU, mandatory consumer protections of your country still apply to you.',
        ]},
        { h: 'Changes', body: [
          'We\'ll update these terms as the product grows, with the date above. Material changes will be noted in the app or by email.',
        ]},
      ]}
    />
  );
}
