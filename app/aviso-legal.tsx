import LegalPage from '@/components/LegalPage';

// Aviso legal — the operator-identification page Spanish e-commerce law (LSSI-CE) expects
// of sites operating toward Spain. DRAFT for operator review; the operator is a US entity,
// so fields like NIF/CIF don't apply — noted plainly rather than faked.

export default function AvisoLegalPage() {
  return (
    <LegalPage
      title="Aviso legal"
      metaTitle="Aviso legal | Camino"
      description="Operator identification for getcamino.app, per Spain's LSSI: who runs Camino and how to reach us."
      canonical="https://getcamino.app/aviso-legal"
      updated="4 July 2026"
      sections={[
        { h: 'Titular del sitio / Site operator', body: [
          'getcamino.app ("Camino") is operated by Proxim.us, PO Box 1973, Vashon, WA 98070, United States — a US-based operator (no Spanish NIF/CIF applies).',
          'Contact: nerolabs@gmail.com, or the "Report a problem" form in the app.',
        ]},
        { h: 'Purpose', body: [
          'Camino provides general informational guidance for people planning a move to Spain: a personalized sequence of steps with links to official government sources. It is not legal, tax, or immigration advice, and it is not a gestoría or law firm.',
        ]},
        { h: 'Content and liability', body: [
          'Official steps cite their government sources; verify specifics against those sources or a qualified professional before acting. Use of the site is governed by our Terms of use, and personal data is handled per our Privacy policy (both linked in the footer).',
        ]},
        { h: 'Intellectual property', body: [
          'Site content and branding belong to the operator except where otherwise noted. Links to official government resources are provided for verification and belong to their respective owners.',
        ]},
      ]}
    />
  );
}
