/**
 * Question-shaped SEO pages (TODO 23b, 2026-07-12) — /questions/<slug>.
 *
 * Curated, not generated: each answer is hand-written prose composed strictly from facts
 * the catalog already carries. The digit rule is mechanical (tests/questions.test.ts):
 * any digit in an answer must already appear in the title of one of the entry's `related`
 * obligations — the same invariant-3 guard the guide explainers live under. Where a fact
 * would need a figure the catalog doesn't carry (e.g. the 183-day tax-residency rule),
 * the answer says it in words ("more than half the year") and defers to the guide.
 *
 * English-only for now (like the homework pages); localization is a later pass. Every
 * page links its `related` guides (the sourced steps) and the interview.
 */

export type QuestionPage = {
  slug: string;        // /questions/<slug>
  question: string;    // the H1 — phrased the way people actually search
  answer: string[];    // paragraphs; digits guarded against related titles
  related: string[];   // catalog ids — rendered as guide links, and the digit pool
};

export const QUESTIONS: QuestionPage[] = [
  {
    slug: 'do-i-need-a-visa-to-move-to-spain',
    question: 'Do I need a visa to move to Spain?',
    answer: [
      'It depends entirely on your passport. Citizens of EU or EEA countries and Switzerland don’t need a visa at all — you can move first and register once you’re there, with a certificate that makes your residence official.',
      'Everyone else needs a residence visa before moving, and the right one depends on how you’ll support yourself: passive income or savings point to the non-lucrative visa, remote work for a foreign employer points to the digital-nomad visa, and studying, employment in Spain, or joining family each have their own route. Choosing the category is genuinely the first step — most of the paperwork that follows depends on it.',
      'Whichever route applies, the application itself is lodged from your home country at the Spanish consulate that covers where you live — and the appointment, not the paperwork, is usually the bottleneck.',
    ],
    related: ['choose-visa-type', 'eu-registration-certificate', 'consulate-appointment'],
  },
  {
    slug: 'non-lucrative-visa-income-requirement',
    question: 'How much income do I need for Spain’s non-lucrative visa?',
    answer: [
      'The non-lucrative visa (NLV) is for people who can support themselves without working in Spain — retirees and people living on savings or passive income. The bar is set as a multiple of Spain’s IPREM index: 400% of IPREM for the main applicant, which currently works out to about €28,800 per year, plus €7,200 per year for each dependent who moves with you.',
      'Two things people miss: the money must be demonstrably passive (pensions, investments, rent — not a salary you plan to keep earning), and consulates want to see it evidenced cleanly across bank statements and official documents. If your income is close to the line, plan how you’ll evidence it before booking the consulate appointment, not after.',
    ],
    related: ['nlv-income-check', 'choose-visa-type', 'consulate-appointment'],
  },
  {
    slug: 'digital-nomad-visa-income-requirement',
    question: 'How much do I need to earn for Spain’s digital-nomad visa?',
    answer: [
      'The digital-nomad visa (DNV) is for people who work remotely for employers or clients outside Spain. The income requirement is pegged to Spain’s minimum wage: 200% of it for the main applicant — about €34,000 per year — plus roughly €13,000 for a spouse or partner and about €4,000 for each child.',
      'The income must come from remote work you can document: an employment contract or client agreements, plus a letter from your employer explicitly authorizing you to work from Spain. Freelancers qualify through client contracts instead.',
    ],
    related: ['dnv-income-check', 'dnv-remote-work-proof', 'dnv-employer-permission-letter', 'choose-visa-type'],
  },
  {
    slug: 'what-is-empadronamiento',
    question: 'What is empadronamiento, and why does everyone mention it?',
    answer: [
      'The padrón is your town hall’s census, and empadronamiento is the act of registering yourself on it at your Spanish address. It costs nothing and feels bureaucratically minor — but it’s the key that unlocks almost everything local: your residence card appointment, the public health card, school enrollment, even discounts on local services.',
      'That’s why it sits so early in every arrival checklist: until you’re on the padrón, several downstream steps simply can’t start. Register as soon as you have an address — even a rental — and keep the certificate; you’ll be asked for it repeatedly in your first months.',
    ],
    related: ['empadronamiento', 'residencia', 'tarjeta-sanitaria'],
  },
  {
    slug: 'what-is-a-nie-and-how-do-i-get-one',
    question: 'What is a NIE and how do I get one?',
    answer: [
      'The NIE (Número de Identidad de Extranjero) is your foreigner identification number in Spain — and you’ll need it for nearly everything official or financial: opening a bank account, signing a rental contract, buying property, paying taxes, setting up utilities.',
      'You apply with form EX-15, either at a Spanish consulate before you move or at an extranjería office or police station once you’re in Spain. It’s a number, not a residence permit — long-stay movers will still complete their residence card separately — but getting the NIE early removes a blocker from a surprising number of later steps.',
    ],
    related: ['nie', 'residencia'],
  },
  {
    slug: 'what-documents-need-an-apostille-for-spain',
    question: 'Which documents need an apostille for Spain?',
    answer: [
      'Foreign public documents — birth certificates, marriage certificates, criminal-record checks, and similar — need an apostille under the 1961 Hague Convention before Spanish authorities will accept them. The apostille must come from the country that issued the document, so a certificate issued back home can’t be apostilled from inside Spain.',
      'Timing is the trap: your criminal-record check must be issued within 90 days of the visa application, and it needs both the apostille and a certified Spanish translation inside that window. List every document your visa route needs, work out which country issued each one, and start the apostille requests early — they’re often the slowest link in the chain.',
    ],
    related: ['apostille-documents', 'criminal-background-check', 'sworn-translation'],
  },
  {
    slug: 'declare-foreign-assets-modelo-720',
    question: 'Do I have to declare my foreign assets when I move to Spain?',
    answer: [
      'Once you become a Spanish tax resident — broadly, once Spain is where you spend more than half the year or hold your center of interests — you may need to file Modelo 720, the informational declaration of assets held abroad. It applies when any single category (foreign accounts, investments, or real estate) exceeds €50,000.',
      'It’s informational — filing it doesn’t itself create tax — but skipping it carries real penalties, and the filing window is fixed: 1 January to 31 March for the previous year. If your foreign holdings are anywhere near the threshold, put it on your first-spring calendar before you move.',
    ],
    related: ['modelo-720'],
  },
  {
    slug: 'how-long-to-get-tie-after-arriving',
    question: 'How long do I have to get my residence card (TIE) after arriving in Spain?',
    answer: [
      'Visa holders should start the TIE process — the fingerprinting appointment known as the huella — within 30 days of entering Spain. The card is what turns your visa into physical proof of residence, and several later steps hang off the date it establishes.',
      'The catch is appointment scarcity: in big cities the wait for a slot can run several weeks, which eats your window fast. Book the appointment as one of your first arrival tasks — you’ll want your padrón registration in hand for it, which is why the two steps sit together at the top of every arrival sequence.',
    ],
    related: ['residencia', 'empadronamiento'],
  },
];

export const questionBySlug = new Map(QUESTIONS.map(q => [q.slug, q]));
