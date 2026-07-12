/**
 * es-ES narrative for each guide page (L1) — the Spanish twin of core/guide-prose.ts.
 *
 * SAME HONESTY CONTRACT (invariant 3, enforced by tests/guide-prose-es.test.ts):
 *  - May restate facts already in the obligation's (Spanish) title; may add process/context.
 *  - May NOT introduce a number the title doesn't carry — digit-lint fails the build.
 *  - Voice: the same plain, warm, honest Camino voice, in tú. "Get Camino" and "Lola" verbatim.
 */

export const ES_GUIDE_PROSE: Record<string, string> = {
  'dnv-income-check':
    'La misma aritmética, para la ruta del nómada digital: tu franja de ingresos frente al umbral para un hogar de tu tamaño sugiere un déficit. Las franjas son aproximadas y esto no es un veredicto — pero la prueba de ingresos remotos es el corazón de una solicitud de DNV, así que conviene resolver el desfase sobre el papel antes de reservar nada. Un asesor puede decirte qué cuenta como ingreso demostrable y si otra ruta te sirve mejor.',
  'nlv-income-check':
    'Es aritmética sobre tus propias respuestas, hecha por ti: comparar tu franja de ingresos con el umbral de la NLV para un hogar de tu tamaño sugiere un déficit. No es un veredicto — las franjas son aproximadas y los consulados miran el conjunto de las pruebas — pero es mucho mejor descubrirlo al planificar que en la cita. Una sesión con un asesor de extranjería sobre cómo acreditar tus medios, o sobre si otra ruta encaja mejor, es dinero bien invertido aquí.',
  'language-classes':
    'Este es el consejo de Get Camino, no un requisito legal: cuanto antes empieces a construir un español real, más fácil será todo lo demás — el funcionario del padrón, el médico, tus vecinos, el contrato que vas a firmar. Sirven las clases formales, un profesor particular o un curso intensivo nada más llegar; lo que importa es empezar antes de necesitarlo. Y si la nacionalidad entra alguna vez en tu horizonte, el nivel de idioma que tendrás que certificar es mucho más fácil de alcanzar cuando llevas tiempo practicando.',
  'scout-where-to-live':
    'Casi toda la maquinaria de mudarse a España pregunta «¿dónde?» antes de poder hacer nada por ti — el padrón, los colegios, incluso qué oficina lleva tus trámites cuelgan de una dirección. Esto es un consejo de Get Camino, no un requisito legal: pasa tiempo real en tus zonas candidatas antes de comprometerte, y en la estación en la que de verdad vivirías allí. Un contrato de alquiler es mucho más fácil de firmar que de deshacer.',
  'choose-visa-type':
    'Todo lo demás en tu mudanza fluye de esta decisión: qué vía de residencia encaja con tu trabajo, tus ingresos, tu familia y tus planes. Cada tipo de visado tiene su propia lista de pruebas, su propio calendario y su propio ritmo de renovación — elegir pronto es lo que hace que el resto de la hoja de ruta se pueda ordenar. Si dos vías podrían encajar, las diferencias que importan suelen ser el derecho a trabajar y los impuestos, y esa conversación merece un profesional.',
  'consulate-appointment':
    'Los visados de larga duración se presentan desde tu país, en el consulado español que cubre tu domicilio — a través de su sistema de cita previa. El cuello de botella suele ser la cita, no el papeleo: asegura la fecha primero y reúne los documentos con ella en el horizonte. Los plazos varían mucho de un consulado a otro — unas semanas en algunos, varios meses en otros — y la página de tu consulado es la fuente de verdad sobre los plazos actuales.',
  'criminal-background-check':
    'España pide a los solicitantes de larga duración un certificado de antecedentes penales limpio del país (o países) donde has vivido recientemente — apostillado y traducido al español por traductor jurado. Las ventanas de validez son cortas y la burocracia emisora es lenta, así que esto es un puzle de tiempos: pídelo lo bastante tarde para que siga vigente y lo bastante pronto para que llegue. Los 90 días de validez del título y el atajo del channeler en EE. UU. vienen directamente de la práctica consular — revisa la redacción exacta de tu consulado.',
  'medical-certificate':
    'Una carta de un médico, en papel oficial, declarando que no padeces las enfermedades del Reglamento Sanitario Internacional — los consulados son estrictos con la redacción, así que lleva su plantilla a la consulta en vez de improvisar. Como el certificado de antecedentes, tiene una ventana de validez corta (los 90 días del título), así que encaja al final de tu recogida de documentos.',
  'nlv-income-proof':
    'La visa no lucrativa es la vía española de «vivir aquí sin trabajar», así que las pruebas van de medios pasivos: las cifras del título — €28,800 al año para el solicitante principal más €7,200 por dependiente — son la expresión actual de la regla del 400% del IPREM, y se mueven cuando se mueve el IPREM. Los consulados quieren ver dinero genuinamente pasivo y recurrente: pensiones, dividendos, alquileres — no un sueldo disfrazado.',
  'nlv-health-insurance':
    'Quien solicita la NLV debe llegar totalmente asegurado por una aseguradora privada autorizada en España, con cobertura comparable a la pública: sin copagos, sin carencias. Un seguro de viaje no vale. Las aseguradoras conocen bien este mercado — pide expresamente una póliza apta para visado y consigue por escrito la confirmación de cumplimiento para tu solicitud.',
  'convenio-especial':
    'El Convenio Especial es la puerta de pago a la sanidad pública para residentes que aún no cotizan: una cuota mensual fija (las cifras del título, por tramos de edad) a cambio de la cobertura del sistema público. Se abre tras el año de residencia continuada y empadronada que marca el título — una mejora habitual para residentes no lucrativos cuando las primas privadas empiezan a doler.',
  'dnv-remote-work-proof':
    'La reclamación central del visado de nómada digital es que tu trabajo ocurre en remoto para empleadores o clientes fuera de España — y la prueba es contractual. Reúne los acuerdos que demuestren que la relación existe y que trabajar en remoto desde España está realmente permitido; la carta del empleador y el certificado de actividad de la empresa, también en tu hoja de ruta, completan la misma historia.',
  'dnv-income-proof':
    'El requisito de medios de la DNV sigue al salario mínimo español, no al IPREM: las cifras del título — unos €34,000 al año, más aproximadamente €13,000 por cónyuge y €4,000 por hijo — son la expresión actual de esa fórmula, y suben cuando sube el salario mínimo. Extractos, contratos y nóminas que cuenten una sola historia coherente valen más que cualquier documento suelto.',
  'dnv-coverage-certificate':
    'La seguridad social es la esquina más delicada de la DNV: España quiere saber que tus cotizaciones están resueltas en alguna parte. Un certificado de cobertura bajo un convenio de totalización (el de EE. UU., o el A1 británico) te mantiene en tu sistema de origen; sin él, la alternativa es darte de alta en la Seguridad Social española. Qué camino aplica depende de tu estructura laboral — es una cuestión que conviene cerrar antes de la solicitud, no después.',
  'empadronamiento':
    'El padrón es tu entrada en el censo del ayuntamiento diciendo «esta persona vive en esta dirección» — y desbloquea, sin hacer ruido, media vida administrativa española: la tarjeta sanitaria, la plaza escolar, los trámites de residencia. Es una cita corta con tu contrato de alquiler o prueba de domicilio, y es gratis. Si haces un solo trámite en tu primera semana, que sea este.',
  'nie':
    'El NIE es tu número de identidad de extranjero — no es un permiso de residencia, solo el número con el que España sabe que tú eres tú. Casi todo lo financiero u oficial (cuentas bancarias, contratos, impuestos, vivienda) lo pide, y por eso va tan pronto en tu hoja de ruta. El formulario EX-15 es la solicitud; el cuello de botella habitual son las citas.',
  'eu-registration-certificate':
    'Los ciudadanos de la UE y del EEE no piden visado — se registran. Si te quedas más de los tres meses del título, se espera que entres en el Registro Central de Extranjeros y recojas el certificado de registro verde (formulario EX-18), en persona. Es el documento que convierte la libre circulación en residencia española formal, y pasos posteriores (como la residencia de larga duración) cuentan el tiempo desde él.',
  'residencia':
    'La TIE es la tarjeta física que acredita tu estatus de residente — en la cita te toman las huellas y la tarjeta llega semanas después. El reloj del título importa: el trámite debe empezar dentro de los 30 días tras la entrada, y las colas de cita en las ciudades grandes se comen esa ventana rápido. Una vez establecida tu residencia, toda una familia de relojes posteriores (renovaciones, permiso de conducir, nacionalidad) empieza a contar desde ella — por eso Get Camino reancla tu plan alrededor de esta fecha.',
  'tarjeta-sanitaria':
    'La tarjeta sanitaria es tu tarjeta del sistema público de salud, emitida cuando de verdad tienes acceso — por cotizar, o por otra vía que dé derecho. Se solicita en tu centro de salud con el certificado de empadronamiento. Los residentes no lucrativos son la excepción por diseño: la NLV funciona con seguro privado, y por eso este paso puede no aparecer en una hoja de ruta NLV.',
  'exit-tax-return':
    'Salir limpiamente de un sistema fiscal importa tanto como entrar en el nuevo. Comunicar a la agencia tributaria de tu país que has cambiado de residencia fiscal — con la forma que eso tome allí — evita años de cartas de «no presentaste» y dolores de doble retención. Es una recomendación de Get Camino, no un requisito español; las reglas de tu país de origen son aquí la fuente de verdad.',
  'modelo-720':
    'La declaración española de bienes en el extranjero: siendo ya residente fiscal, los activos fuera que superen el umbral por categoría del título se declaran en la ventana del primer trimestre que el título indica. Es informativa — la declaración en sí no paga impuesto — pero conlleva sanciones por no presentarla, y su historia (la sentencia europea que menciona el título) es exactamente la razón para tomársela en serio sin miedo. Un gestor la presenta en una tarde.',
  'dgt-exchange':
    'Si tu país tiene convenio bilateral con España, tu permiso de conducir se convierte por canje: un reconocimiento médico-psicotécnico y papeleo en la DGT, sin examen. La lógica de plazos del título es la trampa — un permiso extranjero solo sigue siendo válido un tiempo limitado después de hacerte residente, así que esto va en tu calendario, no en tu lista de «algún día».',
  'dgt-exam':
    'Sin convenio bilateral toca sacarse el permiso español a la manera local: examen teórico (disponible en inglés en la mayoría de provincias) y práctico reservado a través de una autoescuela. Es una inversión de tiempo real, y la ventana de validez de tu permiso extranjero tras la residencia (mira la guía del canje) es el mismo reloj — empieza antes de que se agote.',
  'escolarizacion':
    'Las plazas escolares se asignan en una ronda anual de admisión — la ventana de primavera del título para empezar en septiembre — gestionada por tu comunidad con puntos por cercanía y hermanos. Llegar fuera de ese ciclo no es un callejón sin salida: el proceso «fuera de plazo» asigna plaza entre lo que queda, lo que hace que tu elección de barrio y tu fecha de padrón importen aún más.',
  'family-reunification':
    'La reagrupación familiar es la vía para traer a la familia después de asentarte, en lugar de solicitar todos juntos desde el principio. El título lleva lo esencial: se abre tras tu primera renovación y te pide acreditar vivienda adecuada y medios. Es un trámite denso en documentos y la práctica varía por región — uno de los pasos donde un gestor se gana más claramente sus honorarios.',
  'citizenship-track-standard':
    'El reloj general de la nacionalización: los diez años de residencia legal continuada del título antes de poder solicitar. Aquí no hay nada que hacer salvo conocer la fecha — y proteger la continuidad, porque las ausencias largas pueden resetear más de lo que esperas. Get Camino sigue el hito desde tu fecha de residencia para que el resto del itinerario de nacionalidad se ordene solo.',
  'citizenship-track-latam':
    'El reloj acortado que describe el título: los nacionales de antiguas colonias españolas (la mayor parte de Latinoamérica y algunos más) acceden a la nacionalidad tras dos años de residencia legal en lugar de diez. Si este es tu caso, los exámenes de idioma y de cultura llegan mucho antes de lo que crees — la hoja de ruta los adelanta en consecuencia.',
  'tax-planning-consultation':
    'Los meses antes de convertirte en residente fiscal español son el asesoramiento fiscal más barato que comprarás nunca: programar una venta, un bonus o un evento de pensión para que caiga en el lado correcto de la línea de residencia puede importar muchísimo. Es una recomendación firme de Get Camino, no un paso legal — el punto es un especialista transfronterizo que conozca los dos sistemas, no cualquier asesor.',
  'apostille-documents':
    'La apostilla es el sello internacional de «este documento es auténtico» bajo el Convenio de La Haya que cita el título — y la regla que hace tropezar a la gente también está en el título: cada documento se apostilla en el país que lo emitió. Pide certificados recientes (a los consulados no les gustan los viejos), apostíllalos en origen y solo entonces tradúcelos. Hacerlo desde dentro de España es posible, pero mucho más lento.',
  'sworn-translation':
    'España no acepta cualquier traducción de documentos oficiales: solo un traductor jurado — nombrado por el ministerio de exteriores (MAEC) — produce traducciones con validez legal. Trabajan sobre tus documentos ya apostillados, así que el orden importa: primero la apostilla, después la traducción. Los directorios de traductores jurados son públicos; el plazo suele ser de días, no semanas.',
  'nlv-letter-of-intent':
    'El consulado quiere tu mudanza contada con tus palabras: por qué España, dónde piensas vivir y cómo la sostienen tus ingresos pasivos. No tiene que ser literaria — el listón es que sea coherente y consistente con tus pruebas. Lo que levanta cejas son las contradicciones entre esta carta y tus documentos.',
  'nlv-non-work-declaration':
    'A los solicitantes NLV en edad laboral se les suele pedir notarizar la promesa que el visado ya implica: que no trabajarás en España. Es un documento corto y formulario — la notarización es el punto. Los requisitos varían por consulado, y por eso Get Camino lo lista como recomendado y la lista de tu consulado tiene la última palabra.',
  'dnv-qualification-proof':
    'La DNV te pide demostrar que eres profesional: las dos vías del título son un título universitario (apostillado) o años documentados de experiencia profesional. La vía del título suele ser más simple en pruebas; la de la experiencia se apoya en contratos, referencias y portafolios que cuenten una historia verificable.',
  'dnv-company-activity-proof':
    'España quiere ver que la empresa para la que trabajas es real y está establecida — el certificado de constitución del título acreditando que el negocio lleva operando al menos el periodo indicado. Es un documento que produce tu empleador o cliente, así que pídelo pronto; el papeleo corporativo se mueve a velocidad corporativa.',
  'dnv-employer-permission-letter':
    'Para solicitantes DNV por cuenta ajena (no freelance): una carta de tu empleador autorizando el trabajo remoto desde España y describiendo tu puesto. Los departamentos de RR. HH. ya tienen plantillas para esto; la carta debe cuadrar con tu contrato y con tu historia de cobertura — la consistencia entre documentos es lo que revisa quien evalúa.',
  'spanish-bank-account':
    'No es obligatorio por ley, pero la vida sin un IBAN español es fricción en todas partes: suministros, alquiler, impuestos y tasas lo prefieren, y algunas domiciliaciones lo exigen. Lo útil está en el título: muchos bancos abren cuentas de no residente en remoto antes de llegar, y luego la conviertes en cuenta de residente cuando existan tu NIE y tu TIE.',
  'digital-certificate':
    'El certificado digital de la FNMT es tu identidad online ante las administraciones españolas: con él, declaraciones, certificados de padrón y notificaciones oficiales pasan desde tu sofá en vez de una sala de espera. España notifica cada vez más por vía electrónica, estés mirando o no — por eso este paso «opcional» es una de las horas de mayor palanca de toda la hoja de ruta.',
  'modelo-030':
    'El Modelo 030 es tu presentación ante Hacienda: te registra en el censo de obligados tributarios como nuevo residente y fija tu domicilio fiscal. Es un formulario simple con un efecto desproporcionado — que la correspondencia fiscal llegue a la dirección correcta — y hace más limpia cada presentación posterior.',
  'beckham-law':
    'El régimen especial de impatriados que describe el título: los recién llegados que cualifican pueden optar por un tipo fijo sobre la renta de fuente española durante un periodo limitado, en lugar de los tipos progresivos estándar. El título trae su propia advertencia — la ventana de elección es estricta y la elegibilidad tiene aristas (los autónomos estándar normalmente no cualifican) — así que trátalo como una decisión a tomar con un asesor fiscal en cuanto empiece tu actividad, no en tu primera renta.',
  'modelo-100':
    'La declaración anual de la renta, presentada en la ventana de primavera del título por el año natural anterior. La mayoría de residentes la presenta con un gestor o con el borrador de la propia Hacienda; el trabajo está en reunir los certificados del año, no en el formulario. Conlleva sanciones por presentar tarde — por eso está marcada como está en tu hoja de ruta.',
  'wealth-tax':
    'España grava anualmente los patrimonios grandes, con el mínimo estatal del título más una exención por vivienda habitual — y con variación regional que cambia resultados de verdad (el ejemplo de Cataluña del título). Se presenta junto a la renta. Si tus activos rondan los umbrales, esto casa naturalmente con la declaración de bienes en el extranjero de tu hoja de ruta, y con la misma ayuda profesional.',
  'register-autonomo':
    'Hacerse autónomo en España es una doble alta en la misma semana, exactamente como lo ordena el título: el alta censal en Hacienda (Modelo 036) y después el régimen de autónomos de la Seguridad Social (RETA) dentro de la ventana del título. El orden importa, y las reglas de plazos cambiaron hace poco (el título recoge la supresión del formulario antiguo) — un gestor convierte esto en un solo recado.',
  'autonomo-social-security':
    'La cuota mensual del RETA es el precio del sistema de autónomos: la tarifa plana reducida del título durante el primer tramo, y después tramos según ingresos. Se domicilia cada mes, así que trátala como gasto fijo en tus precios — y mantén la cuenta con fondos, porque los recibos devueltos generan justo el tipo de cartas de deuda que nadie quiere.',
  'modelo-130':
    'Pagos fraccionados trimestrales del IRPF para autónomos, presentados en los meses del título: cada trimestre calculas el beneficio acumulado y pagas a cuenta una porción de impuesto, que tu renta anual luego reconcilia. Saltarse un trimestre acumula recargos — esto es trabajo de calendario, y es exactamente para lo que existen los paquetes trimestrales de los gestores.',
  'modelo-303':
    'La declaración trimestral de IVA, presentada en los meses del título — y el paréntesis del título es la trampa que los recién llegados no ven: se exige incluso cuando el IVA a pagar es cero, porque la obligación es presentarla. Un software de facturación o un gestor lo convierten en un no-evento; ignorar un trimestre «sin nada que declarar» lo convierte en sanción.',
  'modelo-390':
    'El resumen de IVA de fin de año que describe el título: un recapitulativo informativo de los trimestres del año, presentado electrónicamente en la ventana de enero del título. No se paga impuesto nuevo — tiene que cuadrar con tus trimestrales, y justo por eso una contabilidad trimestral ordenada lo hace trivial.',
  'modelo-200':
    'El impuesto de sociedades de una empresa española, con vencimiento en la fecha de julio del título por el ejercicio anterior. Si constituiste una SL en vez de trabajar como autónomo, esto es territorio firme de contable — la declaración descansa sobre cuentas anuales bien cerradas, no sobre un formulario rellenado la noche antes.',
  'student-visa-health-insurance':
    'El visado de estudios lleva su propio listón de seguro, y el título lo enumera con precisión: aseguradora autorizada en España, cobertura equivalente al sistema público, sin copagos, sin carencias, repatriación incluida. Las pólizas de viaje genéricas suspenden este examen constantemente — pide a la aseguradora que confirme por escrito el cumplimiento para visado de estudios y adjunta esa confirmación a tu solicitud.',
  'nlv-renewal':
    'La NLV se renueva al ritmo del título: presenta en la ventana previa al vencimiento (el título también recoge la gracia por presentación tardía y su multa), acreditando lo mismo que te dio el visado — ingresos pasivos continuados y seguro. Las renovaciones miran además algo nuevo: presencia real en España, porque la NLV espera que de verdad vivas aquí. Apunta la ventana en el calendario el día que llegue tu tarjeta.',
  'dnv-renewal':
    'El permiso de nómada digital se renueva en los periodos plurianuales del título mientras se mantengan las condiciones — la misma lógica de ingresos, la misma historia de trabajo remoto, gestionado por la UGE-CE bajo la Ley de Startups. Mantén ordenado el rastro de pruebas (contratos, facturas, extractos) sobre la marcha y la renovación será un trabajo de montaje, no una investigación.',
  'permanent-residence':
    'Tras los cinco años de residencia legal continuada del título, la residencia de larga duración te baja de la noria de renovaciones: un solo estatus, renovado como formalidad, sin volver a demostrar ingresos cada ciclo. La solicitud mira hacia atrás — lo que se examina es la continuidad de la residencia — así que las ausencias y los huecos en tu expediente pesan más que tus circunstancias actuales.',
  'property-legal-due-diligence':
    'La recomendación inmobiliaria más firme de Get Camino: un abogado independiente (el tuyo, no el del vendedor ni el de la agencia) comprueba título, cargas, situación urbanística y cédula de habitabilidad antes de que se mueva el dinero. En España las deudas de una vivienda pueden seguir a la vivienda y no a la persona — exactamente por eso las comprobaciones van antes de la firma, nunca después.',
  'completion-deed-notary':
    'La compraventa española se cierra ante notario: se firma la escritura de compraventa, se paga el resto y se entregan las llaves en la misma sesión. El notario certifica la legalidad, no te representa — eso lo hace tu abogado — y, como recoge el título, la escritura pública es la formalización estándar (e inevitable con hipoteca).',
  'land-registry-registration':
    'El título dice la parte silenciosa: inscribir en el Registro de la Propiedad es técnicamente voluntario — y aun así deberías hacerlo siempre. La inscripción es lo que hace tu propiedad visible y defendible frente a terceros. Normalmente tu notario o gestoría la tramita como parte del cierre; confírmalo en vez de asumirlo.',
  'property-transfer-tax':
    'Comprar vivienda de segunda mano dispara el ITP al tipo de tu comunidad — el rango del título muestra cuánto importa la geografía. Se autoliquida y paga poco después del cierre, y la escritura generalmente no puede inscribirse hasta que esté pagado — por eso va justo detrás de la cita con el notario en tu hoja de ruta.',
  'ibi-property-tax':
    'El IBI es el impuesto municipal anual de tu vivienda, girado por el ayuntamiento en el mes que use tu municipio. La jugada fiable es domiciliarlo — algunos ayuntamientos incluso descuentan por ello — porque el recibo no siempre se anuncia antes de estar vencido.',
  'community-fees':
    'Si tienes un piso en un edificio compartido, eres miembro de la comunidad de propietarios por ley (el título cita la norma): las cuotas pagan el ascensor, el tejado, todo lo común. Las cuotas impagadas se adhieren a la propia vivienda, así que comprueba deudas antes de comprar y presupuéstalas como coste fijo después.',
  'nonresident-property-tax':
    'El título describe el impuesto inmobiliario más peculiar de España: si tienes una vivienda española sin ser (aún) residente fiscal, Hacienda le imputa una renta teórica — aunque esté vacía — declarada con el Modelo 210 en el plazo del título. Deja de aplicar cuando eres residente fiscal; hasta entonces es un ritual anual del que muchos propietarios literalmente no oyen hablar hasta que llega la carta.',
  'pet-import':
    'El título es la lista: primero el microchip, la vacuna antirrábica puesta al menos los días indicados antes del viaje, y — desde un país no UE — el certificado zoosanitario UE emitido por un veterinario autorizado dentro de la ventana ajustada del título antes de la entrada. Esa última ventana te organiza la agenda sola: la visita al veterinario cae en tus últimos días antes del vuelo, así que resérvala cuando reserves los billetes.',
  'dele-a2-exam':
    'La nacionalización exige acreditar español básico, y el DELE A2 (Instituto Cervantes) es la vía estándar — con convocatorias a lo largo del año en centros acreditados, así que la plaza es cuestión de agenda. Evalúa comunicación cotidiana, no literatura. Los hispanohablantes nativos de países exentos lo saltan, y por eso puede no aparecer en algunas hojas de ruta.',
  'ccse-exam':
    'El CCSE es la mitad cívica de la nacionalización: un test corto tipo test sobre la Constitución y la sociedad española, gestionado por el Instituto Cervantes con un banco de preguntas publicado. Como todas las preguntas son públicas de antemano, la preparación es genuinamente mecánica — reserva la convocatoria, machaca el banco, listo.',
  'citizenship-application':
    'La solicitud en sí: nacionalidad por residencia, presentada ante el Ministerio de Justicia cuando tu reloj de elegibilidad ha corrido y los exámenes están aprobados. Hoy se presenta electrónicamente, y después — honestamente — lo difícil es la paciencia, porque la resolución suele tardar años. Todo en tu expediente debe estar vigente al presentar; los certificados caducados son el clásico rechazo evitable.',
  'citizenship-jura':
    'El último acto formal de hacerse español, exactamente como lo describe el título: el juramento de fidelidad al Rey y obediencia a la Constitución, ante el Registro Civil. El plazo del título es lo único que hay que respetar — la concesión caduca si la jura no se completa en su ventana tras la notificación. Después de años de proceso, esto es una cita y una frase — disfrútalo.',
};
