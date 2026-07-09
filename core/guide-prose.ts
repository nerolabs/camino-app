/**
 * Curated narrative for each guide page — "what this actually is", in Get Camino's voice.
 *
 * HONESTY CONTRACT (invariant 3, enforced by tests/guide-prose.test.ts):
 *  - Prose may restate facts already present in the obligation's own title, and may add
 *    process/context narrative (what the thing is, how it feels, who's involved).
 *  - It may NOT introduce new numbers, deadlines, fees, or legal conditions. The digit-lint
 *    test fails the build if a number appears here that isn't in the title. Specifics the
 *    title doesn't carry belong behind the official source link, not in this file.
 *  - Voice: plain, warm, honest. Penalty items stay firm — never soothed into optional.
 */

export const GUIDE_PROSE: Record<string, string> = {
  'language-classes':
    'This is Get Camino\'s advice, not a legal requirement: the sooner you start building real Spanish, the smoother everything else goes — the padrón clerk, the doctor, your neighbours, the lease you\'re signing. Formal classes, a private tutor, or an intensive once you land all work; what matters is starting before you need it. And if citizenship is ever on your horizon, the language level you\'ll need to certify is far easier to reach once you\'ve been at it for a while.',
  'scout-where-to-live':
    'Most of the moving-to-Spain machinery asks "where?" before it can do anything for you — the padrón, schools, even which office handles your paperwork all hang off an address. This is Get Camino\'s advice rather than any legal requirement: spend real time in your candidate areas before committing, in the season you\'d actually live there. A rental contract is much easier to sign than to escape.',
  'choose-visa-type':
    'Everything else in your move flows from this decision: which residence route matches your work, income, family and plans. Each visa type has its own evidence list, its own timeline, and its own renewal rhythm — choosing early is what makes the rest of the roadmap sequenceable. If two routes could fit, the differences that matter are usually about work rights and taxes, and that\'s a conversation worth having with a professional.',
  'consulate-appointment':
    'Long-stay visas are lodged from your home country, at the Spanish consulate that covers where you live — through its cita previa (appointment) booking system. The appointment slot, not the paperwork, is usually the bottleneck: secure the date first and assemble documents toward it. The title\'s lead-time range reflects what applicants commonly see in the US; your consulate\'s own page is the source of truth.',
  'criminal-background-check':
    'Spain asks long-stay applicants for a clean criminal record from the country (or countries) where you\'ve recently lived — apostilled, and translated into Spanish by a sworn translator. Validity windows are short and the issuing bureaucracy is slow, so this is a timing puzzle: order it late enough to stay valid, early enough to arrive. The title\'s 90-day validity and the US channeler shortcut come straight from consular practice — check your consulate\'s exact wording.',
  'medical-certificate':
    'A doctor\'s letter, on official letterhead, stating you don\'t carry the diseases named in the International Health Regulations — the consulates are strict about the wording, so bring their template to your appointment rather than improvising. Like the background check it has a short validity window (the title\'s 90 days), so it slots near the end of your document gathering.',
  'nlv-income-proof':
    'The non-lucrative visa is Spain\'s "live here without working" route, so the evidence is all about passive means: the title\'s figures — €28,800 a year for the main applicant plus €7,200 per dependent — are the current expression of the 400% of IPREM rule, and they move when IPREM does. Consulates want to see the money as genuinely passive and reliably recurring: pensions, dividends, rental income, not a salary in disguise.',
  'nlv-health-insurance':
    'NLV applicants must arrive fully insured by a Spanish-authorised private insurer, with cover comparable to the public system: no co-pays, no waiting periods. Travel insurance does not qualify. Insurers know this market well — ask specifically for a visa-compliant policy and get the compliance wording in writing for your application.',
  'convenio-especial':
    'The Convenio Especial is Spain\'s buy-in to public healthcare for residents who don\'t yet contribute through work: a flat monthly premium (the title\'s figures, tiered by age) in exchange for the public system\'s cover. It becomes available after the title\'s year of continuous, padrón-registered residence — a common upgrade path for non-lucrative residents once private premiums start to sting.',
  'dnv-remote-work-proof':
    'The digital nomad visa\'s central claim is that your work happens remotely for employers or clients outside Spain — and the evidence is contractual. Gather the agreements that show the relationship exists and that remote work from Spain is actually permitted; the employer letter and company-activity certificate in your roadmap round out the same story.',
  'dnv-income-proof':
    'The DNV\'s means test tracks Spain\'s minimum wage rather than IPREM: the title\'s figures — about €34,000 a year, plus roughly €13,000 for a spouse and €4,000 per child — are the current expression of that formula, and they rise when the minimum wage does. Bank statements, contracts and payslips that tell one consistent story beat any single document.',
  'dnv-coverage-certificate':
    'Social security is the DNV\'s trickiest corner: Spain wants to know your contributions are handled somewhere. A certificate of coverage under a totalization agreement (the US one, or the UK\'s A1) keeps you in your home system; without one, the alternative is registering with Spanish Social Security. Which path applies depends on your employment structure — this is a question worth settling before the application, not after.',
  'empadronamiento':
    'The padrón is your town hall\'s census entry saying "this person lives at this address" — and it quietly unlocks half of Spanish admin life: the health card, school places, residence procedures. It\'s a short appointment with your rental contract or proof of address, and it\'s free. If you do one piece of bureaucracy in your first week, make it this one.',
  'nie':
    'The NIE is your foreigner identification number — not a residence permit, just the number Spain uses to know you\'re you. Almost everything financial or official (bank accounts, contracts, taxes, property) wants it, which is why it sits so early in your roadmap. Form EX-15 is the application; appointments are the usual bottleneck.',
  'eu-registration-certificate':
    'EU and EEA citizens don\'t get visas — they register. Stay past the title\'s three months and you\'re expected to enter the Central Register of Foreign Nationals and collect the green certificado de registro (form EX-18), in person. It\'s the document that turns free movement into formal Spanish residence, and later steps (like permanent residence) count time from it.',
  'residencia':
    'The TIE is the physical card that proves your residence status — the appointment takes your fingerprints (the huella), and the card follows weeks later. The title\'s clock matters: the process should start within 30 days of entry, and big-city appointment queues eat that window fast. Once your residency is established, a whole family of downstream clocks (renewals, driving licence, citizenship) starts ticking from it — which is why Get Camino re-anchors your plan around this date.',
  'tarjeta-sanitaria':
    'The tarjeta sanitaria is your public health system card, issued once you actually have access — through work contributions, or another qualifying route. It\'s applied for at your local health centre with your padrón certificate. Non-lucrative residents are the exception by design: the NLV runs on private insurance instead, which is why this step may not appear in an NLV roadmap at all.',
  'exit-tax-return':
    'Leaving a tax system cleanly is as important as entering the new one. Telling your home tax authority you\'ve changed tax residence — whatever form that takes where you\'re from — prevents years of "you didn\'t file" letters and double-withholding headaches. This is Get Camino\'s recommendation rather than a Spanish requirement; your home country\'s rules are the source of truth here.',
  'modelo-720':
    'Spain\'s foreign-asset declaration: once you\'re tax resident, overseas holdings above the title\'s per-category threshold must be reported in the title\'s first-quarter window. It\'s informative — no tax is due on the declaration itself — but it carries penalties for not filing, and its history (the EU court ruling the title mentions) is exactly why it should be taken seriously rather than feared. A gestor files it in an afternoon.',
  'dgt-exchange':
    'If your country has a bilateral agreement with Spain, your driving licence converts by exchange: a medical/psychotechnical check and paperwork at the DGT, no driving test. The title\'s deadline logic is the trap — a foreign licence only stays valid for a limited time after you become resident, so this belongs on your calendar, not your someday list.',
  'dgt-exam':
    'No bilateral agreement means earning a Spanish licence the local way: theory exam (available in English in most provinces) and a practical test booked through a driving school. It\'s a genuine time investment, and your foreign licence\'s post-residency validity window (see the exchange guide) is the same clock — start before it runs out.',
  'escolarizacion':
    'School places are allocated through an annual admission round — the title\'s spring window for the September start — run by your region with points for proximity and siblings. Arriving outside that cycle isn\'t a dead end: the fuera de plazo process assigns places from what remains, which makes your neighbourhood choice and your padrón date matter even more.',
  'family-reunification':
    'Reagrupación familiar is the route for bringing family members after you\'ve settled, rather than applying together at the start. The title carries the essentials: it opens after your first renewal, and asks you to show adequate housing and means. It\'s document-heavy and regional practice varies — one of the steps where a gestor most clearly earns their fee.',
  'citizenship-track-standard':
    'The general naturalisation clock: the title\'s ten years of continuous legal residence before you can apply. Nothing to do here but know the date — and protect the continuity, since long absences can reset more than you\'d expect. Get Camino tracks the milestone from your residency date so the rest of the citizenship track sequences itself.',
  'citizenship-track-latam':
    'The shortened clock the title describes: nationals of ex-Spanish colonies (most of Latin America and a few others) qualify for citizenship after two years of legal residence instead of ten. If this is you, the language and civics exams arrive much sooner than you think — the roadmap pulls them forward accordingly.',
  'tax-planning-consultation':
    'The months before you become Spanish tax resident are the cheapest tax advice you\'ll ever buy: timing a sale, a bonus, or a pension event to land on the right side of the residency line can matter enormously. This is Get Camino\'s strong recommendation, not a legal step — a cross-border specialist who knows both systems is the point, not just any adviser.',
  'apostille-documents':
    'An apostille is the international "this document is real" stamp under the title\'s Hague Convention — and the rule that trips people is in the title too: each document is apostilled in the country that issued it. Order certificates fresh (consulates dislike old ones), get them apostilled at home, and only then translated. Doing this from inside Spain is possible but much slower.',
  'sworn-translation':
    'Spain doesn\'t accept just any translation of official documents: only a traductor jurado — sworn in by the foreign ministry (MAEC) — produces translations with legal validity. They work from your apostilled documents, so the order matters: apostille first, translate second. Directories of sworn translators are public; turnaround is usually days, not weeks.',
  'nlv-letter-of-intent':
    'The consulate wants your move in your own words: why Spain, where you intend to live, and how your passive income sustains it. It doesn\'t need to be literary — coherent and consistent with your evidence is the bar. Contradictions between this letter and your documents are what raise eyebrows.',
  'nlv-non-work-declaration':
    'Working-age NLV applicants are often asked to notarise the promise the visa already implies: that you won\'t work in Spain. It\'s a short, formulaic document — the notarisation is the point. Requirements vary by consulate, which is why Get Camino lists it as recommended and your consulate\'s checklist has the final word.',
  'dnv-qualification-proof':
    'The DNV asks you to prove you\'re a professional: the title\'s two routes are a university degree (apostilled) or documented years of professional experience. The degree route is usually simpler evidence-wise; the experience route leans on contracts, references and portfolios telling a verifiable story.',
  'dnv-company-activity-proof':
    'Spain wants to see that the company you work for is real and established — the title\'s certificate of incorporation showing the business has operated for at least the stated period. It\'s your employer\'s or client\'s document to produce, so request it early; corporate paperwork moves at corporate speed.',
  'dnv-employer-permission-letter':
    'For employed (rather than freelance) DNV applicants: a letter from your employer authorising remote work from Spain and describing your role. HR departments have templates for this now; the letter should match your contract and your coverage story — consistency across documents is what the reviewer is checking.',
  'spanish-bank-account':
    'Not legally required, but life without a Spanish IBAN is friction everywhere: utilities, rent, taxes and fees all prefer it, and some direct debits require it. The title\'s tip is the useful part — many banks open non-resident accounts remotely before you arrive, which you can upgrade to a resident account once your NIE and TIE exist.',
  'digital-certificate':
    'The FNMT digital certificate is your online identity for Spanish government sites: with it, tax filings, padrón certificates, and official notifications happen from your sofa instead of a waiting room. Spain increasingly notifies electronically whether you\'re watching or not — which is why this "optional" step is one of the highest-leverage hours in the whole roadmap.',
  'modelo-030':
    'Modelo 030 is how you introduce yourself to Hacienda: it registers you in the tax census as a new resident and fixes your fiscal address. It\'s a simple form with an outsized effect — tax correspondence going to the right address — and it makes every later filing cleaner.',
  'beckham-law':
    'The special inbound-workers regime the title describes: qualifying newcomers can elect a flat rate on Spanish-source income for a limited period, instead of standard progressive rates. The title carries its own warning — the election window is strict and eligibility has sharp edges (standard autónomos usually don\'t qualify) — so treat this as a decision to make with a tax adviser the moment your activity starts, not at your first renta.',
  'modelo-100':
    'The annual income tax return — la renta — filed in the title\'s spring window for the previous calendar year. Most residents file with a gestor or through Hacienda\'s own draft system; the work is gathering the year\'s certificates, not the form itself. It carries late-filing penalties, which is why it\'s marked the way it is in your roadmap.',
  'wealth-tax':
    'Spain taxes large net worth annually, with the title\'s state allowance plus a main-home exemption — and with regional variation that genuinely changes outcomes (the title\'s Catalonia example). It\'s filed alongside the renta. If your assets sit anywhere near the thresholds, this pairs naturally with the foreign-assets declaration in your roadmap, and with the same professional help.',
  'register-autonomo':
    'Becoming self-employed in Spain is a same-week double registration, exactly as the title lays out: the tax census filing with Hacienda (Modelo 036), then Social Security\'s self-employed scheme (RETA) inside the title\'s window. Order matters, and the timing rules changed recently (the title notes the old form\'s abolition) — a gestor makes this a single errand.',
  'autonomo-social-security':
    'The monthly RETA contribution is the price of the self-employed system: the title\'s reduced flat rate for the first stretch, then income-based brackets. It\'s auto-debited monthly, so treat it as fixed overhead in your pricing — and keep the bank account funded, because failed debits create exactly the kind of arrears letters nobody wants.',
  'modelo-130':
    'Quarterly prepayments of income tax for the self-employed, filed in the title\'s months: each quarter you compute profit so far and pay a slice of tax on account, which your annual renta later reconciles. Miss a quarter and surcharges accrue — this is calendar work, and it\'s precisely what gestors\' quarterly packages exist for.',
  'modelo-303':
    'The quarterly VAT return, filed in the title\'s months — and the title\'s parenthesis is the trap newcomers miss: it\'s required even when the VAT due is zero, because the filing itself is the obligation. Invoicing software or a gestor turns this into a non-event; ignoring a "nothing to declare" quarter turns it into a penalty.',
  'modelo-390':
    'The year-end VAT recap the title describes: an informative summary of the year\'s quarterly filings, submitted electronically in the title\'s January window. No new tax is due — it has to reconcile with your quarterlies, which is exactly why tidy quarterly bookkeeping makes it trivial.',
  'modelo-200':
    'The corporation tax return for a Spanish company, due on the title\'s July date for the prior year. If you\'ve incorporated an SL rather than working as autónomo, this is firmly accountant territory — the return rests on properly closed annual accounts, not on a form filled the night before.',
  'student-visa-health-insurance':
    'Student visas carry their own insurance bar, and the title lists it precisely: a Spain-authorised insurer, public-system-equivalent cover, no co-pays, no waiting periods, repatriation included. Generic travel policies fail this test constantly — ask the insurer to confirm student-visa compliance in writing and attach that confirmation to your application.',
  'nlv-renewal':
    'The NLV renews on the title\'s rhythm: file in the window before expiry (the title also notes the late-filing grace and its fine), showing the same things that got you the visa — continued passive income and insurance. Renewals also care about something new: real presence in Spain, since the NLV expects you to actually live here. Calendar the window the day your card arrives.',
  'dnv-renewal':
    'The digital nomad permit renews in the title\'s multi-year periods for as long as the qualifying conditions hold — same income logic, same remote-work story, handled by the UGE-CE under the Startups Law. Keep the evidence trail (contracts, invoices, statements) tidy as you go and the renewal is an assembly job, not an investigation.',
  'permanent-residence':
    'After the title\'s five years of continuous legal residence, long-term residence removes the renewal treadmill: one status, renewed as a formality, no more proving income each cycle. The application looks backward — continuity of residence is the thing being tested — so absences and gaps in your record matter more than your current circumstances.',
  'property-legal-due-diligence':
    'Get Camino\'s strongest property recommendation: an independent lawyer (yours, not the seller\'s or agent\'s) checks title, debts, planning status and the habitation licence before any money moves. Spanish property debts can follow the property rather than the person — which is exactly why the checks come before the signing, never after.',
  'completion-deed-notary':
    'Spanish property completes in front of a notary: the escritura de compraventa is signed, the balance paid, keys handed over in the same sitting. The notary certifies legality rather than representing you — your lawyer does that — and as the title notes, the public deed is the standard formalisation (and unavoidable with a mortgage).',
  'land-registry-registration':
    'The title says the quiet part: registration at the Registro de la Propiedad is technically voluntary — and you should absolutely do it anyway. Registration is what makes your ownership visible to and defensible against third parties. Usually your notary or gestoría files it as part of completion; confirm rather than assume.',
  'property-transfer-tax':
    'Buying a resale property triggers ITP at your region\'s rate — the title\'s range shows how much geography matters. It\'s self-assessed and paid shortly after completion, and the deed generally can\'t be registered until it\'s settled, which is why it sits right behind the notary appointment in your roadmap.',
  'ibi-property-tax':
    'IBI is the annual municipal tax on your home, billed by the town hall in whatever month your municipality uses (the title\'s autumn months are common). The reliable move is a direct debit — some town halls even discount for it — because the bill doesn\'t always announce itself before it\'s overdue.',
  'community-fees':
    'Own a flat in a shared building and you\'re a member of the comunidad de propietarios by law (the title cites the statute): the fees fund the lift, the roof, the shared everything. Unpaid fees attach to the property itself, so check for arrears before buying and budget them as a fixed cost after.',
  'nonresident-property-tax':
    'The title describes Spain\'s quirkiest property tax: own a Spanish home while not (yet) tax resident and Hacienda imputes a notional income on it — even if it sits empty — filed on Modelo 210 by the title\'s deadline. It stops applying once you\'re tax resident; until then it\'s an annual ritual many owners genuinely never hear about until the letter arrives.',
  'pet-import':
    'The title is the checklist: microchip first, rabies vaccination given at least the stated days before travel, and — from a non-EU country — the EU animal health certificate issued by an authorised vet inside the title\'s tight window before entry. That last window does the scheduling for you: the vet visit lands in your final pre-flight days, so book it when you book the flights.',
  'dele-a2-exam':
    'Naturalisation requires proving basic Spanish, and DELE A2 (Instituto Cervantes) is the standard route — offered in exam sessions through the year at accredited centres, so seats are a scheduling exercise. It tests everyday communication, not literature. Native Spanish speakers from exempt countries skip it, which is why it may be absent from some roadmaps.',
  'ccse-exam':
    'The CCSE is the civics half of naturalisation: a short multiple-choice test on the Constitution and Spanish society, run by the Instituto Cervantes from a published question bank. Because every question is public in advance, preparation is genuinely mechanical — book the session, drill the bank, done.',
  'citizenship-application':
    'The application itself: nationality by residence, submitted to the Ministry of Justice once your eligibility clock has run and the exams are passed. It\'s filed electronically these days, and then — honestly — the hard part is patience, as resolution commonly takes years. Everything in your file should be current at filing time; stale certificates are the classic avoidable rejection.',
  'citizenship-jura':
    'The last formal act of becoming Spanish, exactly as the title describes: the oath of fidelity to the King and obedience to the Constitution, sworn at the Registro Civil. The title\'s deadline is the one thing to respect — the grant lapses if the jura isn\'t completed in its window after notification. After years of process, this one is an appointment and a sentence — enjoy it.',
};
