import LegalPage, { type LegalContent } from '@/components/LegalPage';

// Aviso legal — the operator-identification page Spanish e-commerce law (LSSI-CE) expects
// of sites operating toward Spain. DRAFT for operator review; the operator is a US entity,
// so fields like NIF/CIF don't apply — noted plainly rather than faked. The ES version is
// the natural reading for this page's audience; English still prevails on discrepancies.

const EN: LegalContent = {
  title: 'Aviso legal',
  updated: '4 July 2026',
  sections: [
    { h: 'Titular del sitio / Site operator', body: [
      'getcamino.app ("Get Camino") is operated by AELaboratories, Inc, 500 Westover Dr #34489, Sanford, NC 27330, United States — a US-based operator (no Spanish NIF/CIF applies).',
      'Contact: legal@getcamino.app, or the "Report a problem" form in the app.',
    ]},
    { h: 'Purpose', body: [
      'Get Camino provides general informational guidance for people planning a move to Spain: a personalized sequence of steps with links to official government sources. It is not legal, tax, or immigration advice, and it is not a gestoría or law firm.',
    ]},
    { h: 'Content and liability', body: [
      'Official steps cite their government sources; verify specifics against those sources or a qualified professional before acting. Use of the site is governed by our Terms of use, and personal data is handled per our Privacy policy (both linked in the footer).',
    ]},
    { h: 'Intellectual property', body: [
      'Site content and branding belong to the operator except where otherwise noted. Links to official government resources are provided for verification and belong to their respective owners.',
    ]},
  ],
};

const ES: LegalContent = {
  title: 'Aviso legal',
  updated: '4 de julio de 2026',
  sections: [
    { h: 'Titular del sitio', body: [
      'getcamino.app («Get Camino») está operado por AELaboratories, Inc, 500 Westover Dr #34489, Sanford, NC 27330, Estados Unidos — un operador con sede en EE. UU. (no le aplica NIF/CIF español).',
      'Contacto: legal@getcamino.app, o el formulario «Informar de un problema» de la app.',
    ]},
    { h: 'Objeto', body: [
      'Get Camino ofrece orientación informativa general para quienes planean mudarse a España: una secuencia personalizada de pasos con enlaces a fuentes oficiales del gobierno. No es asesoramiento legal, fiscal ni migratorio, y no es una gestoría ni un bufete.',
    ]},
    { h: 'Contenido y responsabilidad', body: [
      'Los pasos oficiales citan sus fuentes; verifica los detalles contra esas fuentes o con un profesional cualificado antes de actuar. El uso del sitio se rige por nuestros Términos de uso, y los datos personales se tratan según nuestra Política de privacidad (ambos enlazados en el pie de página).',
    ]},
    { h: 'Propiedad intelectual', body: [
      'El contenido y la marca del sitio pertenecen al operador salvo indicación en contrario. Los enlaces a recursos oficiales del gobierno se ofrecen para verificación y pertenecen a sus respectivos titulares.',
    ]},
    { h: 'Idioma', body: [
      'Esta página es una traducción por comodidad. En caso de discrepancia, prevalece la versión en inglés.',
    ]},
  ],
};

export default function AvisoLegalPage() {
  return (
    <LegalPage
      metaTitle="Aviso legal | Get Camino"
      description="Operator identification for getcamino.app, per Spain's LSSI: who runs Get Camino and how to reach us."
      canonical="https://getcamino.app/aviso-legal"
      en={EN}
      es={ES}
    />
  );
}
