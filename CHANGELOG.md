# Versión 1.21.0 - Verificación de la deuda pública (2026-09-15)

- Publica una verificación sustancial de la afirmación de que Morena duplicó en siete años la deuda acumulada del país.
- Separa el saldo observado a julio de 2026 de la proyección para el cierre de 2027 y compara pesos nominales, pesos reales y deuda como proporción del PIB.
- Actualiza la biblioteca, la portada, el sitemap, las fechas públicas y la versión del servicio.

# Versión 1.20.11 - Informe completo sin inferencias de coordinación (2026-09-15)

- Elimina de la corrección del supuesto pacto cualquier insinuación residual de coordinación, automatización o bots sin evidencia específica.
- Evita que etiquetas ideológicas automáticas de medios sustituyan la evaluación de las fuentes primarias y la evidencia independiente.
- Mantiene explícito el contexto partidista y la crítica recurrente sin atribuir intención deliberada de engañar.

# Versión 1.20.10 - Una acusación auténtica no prueba el delito (2026-09-15)

- Corrige el caso que declaraba cierta una acusación de Alejandro Moreno únicamente porque él la había pronunciado.
- Separa el acto de habla de la tesis sustantiva sobre un supuesto pacto con el crimen organizado.
- Comprueba que la transcripción del PRI no vincula el inicio del supuesto pacto con 2018 y evita unir pasajes distintos para fabricar esa cronología.
- Clasifica como FALSA la publicación categórica, conserva como circunstancial la autoría de la acusación y documenta el contexto partidista sin atribuir pago, coordinación o intención de mentir.
- Añade salvaguardas generales y regresiones para impedir que una lista compuesta solo por citas vuelva a producir un veredicto afirmativo.

# Versión 1.20.9 - La cita no sustituye al contexto político (2026-09-14)

- Hace que el veredicto recaiga sobre la tesis factual contenida en una cita política, salvo que el usuario pregunte expresamente por su autoría.
- Separa declaración, decisión institucional, consecuencia alegada y atribución al gobierno o partido.
- Corrige el caso de las boletas sin doblez con el Acuerdo INE/CG542/2026: la reserva y revisión individual no equivalen a un conteo automático ni prueban fraude gubernamental.
- Conserva el contexto legítimo —la falta de doblez puede ser una anomalía— y evita atribuir intención, pago o coordinación sin evidencia.
- Añade regresiones para la salida defectuosa de Ricardo Anaya y para una pregunta neutral sobre si realizó la declaración.

# Versión 1.20.8 - Botón verde para compartir (2026-09-14)

- Convierte la franja superior de la portada en un botón verde y accesible para compartir la página.
- Abre el menú nativo de compartir en dispositivos compatibles y copia el enlace como alternativa.
- Destaca también en verde la acción de compartir incluida en los informes.

# Versión 1.20.7 - Limitaciones fieles a la consulta (2026-09-14)

- Elimina atribuciones automáticas a una supuesta instrucción del usuario cuando la consulta no pidió omitir imágenes o fotogramas.
- Mantiene explícita la cobertura visual real sin inventar decisiones del usuario.

# Versión 1.20.6 - Videos sin diálogo no detienen el análisis (2026-09-14)

- Evita que una transcripción vacía o temporalmente no disponible convierta un video de TikTok en un error fatal.
- Continúa con descripción, metadatos, miniatura pública, texto recuperado y búsqueda web, sin atribuir diálogo ni escenas no inspeccionadas.
- Añade una salvaguarda específica para medios descargados y pruebas de regresión para videos sin habla y fallos del transcriptor.

# Versión 1.20.5 - Detección de metapreguntas sin tesis (2026-09-14)

- Reconoce cuando el analizador formula como tesis la pregunta técnica de si un post contiene una afirmación verificable.
- Si la propia respuesta concluye que el fragmento carece de una proposición factual, activa la misma salida breve y elimina fuentes auxiliares.
- Añade una prueba de regresión con la forma exacta observada en la validación pública.

# Versión 1.20.4 - Limpieza completa de resultados sin tesis (2026-09-14)

- Aplica la salida breve también cuando el modelo ya reconoce que no existe una afirmación factual identificable.
- Retira en ese caso la confianza numérica, perfiles auxiliares, auditorías y cualquier fuente que no sea la publicación original.
- Añade una segunda prueba de regresión basada en la respuesta observada en producción.

# Versión 1.20.3 - Enlaces sin afirmación verificable (2026-09-14)

- Separa la identificación técnica de una URL, su autoría y su vista previa de la verificación factual de su contenido.
- Clasifica como `NO VERIFICABLE` los fragmentos elípticos o coloquiales que no permiten formular una proposición completa.
- Elimina porcentajes de credibilidad, auditorías del autor y fuentes técnicas irrelevantes cuando no existe una afirmación que comprobar.
- Añade una prueba de regresión basada en el enlace de Threads de @simonlevymx y conserva las consultas explícitas sobre identidad de enlaces.

# Versión 1.20.2 - Recuperación clara de enlaces compartidos de Threads (2026-09-13)

- Distingue un enlace `/share/…` no resuelto de un límite temporal HTTP 429 y elimina la recomendación inútil de esperar.
- Acepta URLs canónicas de Threads con `/post/` o `/video/`, incluidos los enlaces que agregan un slug descriptivo.
- Indica cómo continuar con la URL canónica, el texto de la publicación o una captura cuando Threads no identifica el contenido.
- Añade pruebas de regresión para enlaces compartidos no resueltos y formatos canónicos actuales.

# Versión 1.20.1 - Atribución no equivale a veracidad (2026-09-13)

- Impide que confirmar quién publicó una acusación convierta la acusación incrustada en CIERTA o PARCIALMENTE CIERTA.
- Exige corroboración independiente para afirmaciones sobre salud, consumo de sustancias, delitos, vida privada y conductas actuales.
- Conserva como NO VERIFICABLE una acusación no corroborada y reserva FALSA para tesis contradichas por evidencia suficiente.
- Audita antecedentes de cualquier emisor sin usar orientación política o etiquetas como sustituto de pruebas.
- Añade una prueba de regresión basada en una acusación sustentada únicamente en fuentes anónimas.

# Versión 1.20.0 - Verificación del presupuesto por hectárea de la Conanp (2026-09-13)

- Publica una verificación original sobre el indicador de 16.2 pesos por hectárea.
- Distingue el cociente agregado de una asignación presupuestaria territorial uniforme.
- Actualiza biblioteca, portada, sitemap, versión y pruebas editoriales.

# Versión 1.19.0 - Verificación sobre robo de vehículos en Chiapas (2026-09-12)

- Publica una verificación original del descenso de 68% reportado en robo de vehículos.
- Distingue comparación mensual, registros administrativos, cifra oculta y causalidad.
- Actualiza portada, biblioteca, sitemap, versión y pruebas de calidad editorial.

# Versión 1.18.1 - Corrección de encuadres sobre PISA y COVID-19 (2026-09-11)

- Corrige la clasificación de afirmaciones que mezclan PISA, COVID-19 y un encuadre de “culpa” o “excusa”.
- Distingue entre comprobar que una autoridad hizo una declaración y demostrar la acusación editorial implícita en esa declaración.
- Incorpora como contraste obligatorio los comentarios directos de Andreas Schleicher, la nota de país de México y el lanzamiento internacional de PISA 2025.
- Evita declarar `CIERTA` una explicación única cuando la OCDE documenta causas concurrentes y tendencias previas a 2020.

# Versión 1.18.0 - Verificación de inversión extranjera directa (2026-09-10)

- Publica una verificación original sobre el récord de IED del primer semestre de 2026.
- Confirma el total de 34,968 millones de dólares y contextualiza que 88.5% correspondió a reinversión de utilidades.
- Distingue el máximo total del descenso del componente de nuevas inversiones.
- Actualiza biblioteca, portada, sitemap, datos estructurados y versión del servicio.

# Versión 1.17.0 - Profundidad editorial y preparación para AdSense (2026-09-10)

- Amplía las dieciocho guías metodológicas con ejemplos, controles y procedimientos únicos.
- Refuerza la portada para destacar verificaciones originales y explicar el estándar de evidencia.
- Publica una página integral de estándares editoriales, independencia, inteligencia artificial y correcciones.
- Añade AdSense, canonical, fecha de actualización, autoría y conteo de fuentes a las páginas de artículos.
- Retira de indexación dos páginas heredadas duplicadas y sincroniza el sitemap.
- Incorpora pruebas automáticas de extensión mínima, fuentes, autoría y señales de monetización.

# Versión 1.13.0 - Verificación de homicidios dolosos (2026-09-07)

- Publica una verificación original del descenso de 86.9 a 42.5 víctimas diarias entre septiembre de 2024 y julio de 2026.
- Recalcula la reducción de 51.1 por ciento y distingue tendencia, redondeo, provisionalidad y causalidad.
- Contrasta la serie del SESNSP con la estadística de defunciones del INEGI.
- Actualiza biblioteca, portada, sitemap y versión del servicio a veintidós publicaciones.

# Versión 1.12.1 - Conteo editorial consistente (2026-09-07)

- Corrige en la portada el acceso a la biblioteca: de 19 a 21 publicaciones.
- Mantiene sincronizadas las dos variantes de la página principal.

# Versión 1.12.0 - Verificación del tráfico del AIFA (2026-09-03)

- Publica una verificación original sobre la cifra de 3.6 millones de pasajeros en el primer semestre de 2026.
- Contrasta el dato con AFAC y DataTur y separa la medición observada de la comparación con una meta no identificada.
- Actualiza la biblioteca a veintiuna publicaciones, el sitemap, los datos estructurados y la versión del servicio.

# Versión 1.9.11 - Conectores Facebook, Instagram y X (2026-08-30)

- Añade rutas documentadas para publicaciones, páginas y grupos públicos de Facebook.
- Integra detalles y transcripciones de Instagram, y texto y datos públicos de X.
- El conector social continúa aunque falle la lectura directa; descarta redirecciones a login como destino del contenido.
- Corrige la clasificación de enlaces cortos como perfiles y separa síntesis automáticas de transcripciones de voz.
- Limita las muestras nuevas para controlar latencia y consumo de créditos.
- No incorpora descarga/transcripción de audio propia para Facebook o X; el alcance depende del contenido devuelto por el proveedor.

# Versión 1.9.10 - Resolución de enlaces cortos de video (2026-08-29)

- Resuelve primero la redirección de enlaces cortos de TikTok.
- Entrega al conector social la URL canónica `tiktok.com/@usuario/video/id`.
- Evita que Captapi rechace enlaces `vt.tiktok.com` como videos inválidos.
- Permite recuperar detalles, comentarios y transcripción del video específico.

# Versión 1.9.9 - Análisis efectivo de perfiles y videos (2026-08-29)

- Impide que una auditoría de perfil reemplace el veredicto factual por un mensaje técnico.
- Abre automáticamente hasta cinco videos públicos recuperados de un perfil de TikTok.
- Solicita detalles y transcripción de cada video antes de analizar sus afirmaciones.
- Conserva el veredicto, la credibilidad y la afirmación principal producidos por la investigación.
- Utiliza descripciones, títulos, subtítulos, citas, copias y fuentes relacionadas cuando falta una transcripción.

# Versión 1.9.8 - Verificación integral automática (2026-08-29)

- Elimina los botones para escoger entre afirmación, cuentas y perfil.
- Ejecuta siempre la verificación factual, la revisión de la cuenta y la detección de coordinación como un solo proceso.
- Mantiene el veredicto factual como resultado principal y presenta cuentas o automatización como contexto complementario.
- Devuelve una limitación clara cuando no existen suficientes datos públicos para investigar cuentas relacionadas.

# Versión 1.9.7 - Resumen para redes sociales (2026-08-29)

- Añade un botón para copiar un resumen listo para publicar en redes sociales.
- Limita automáticamente el texto a 750 caracteres.
- Incluye veredicto, afirmación, explicación esencial, enlace y etiquetas identificadoras.
- Confirma visualmente la copia y muestra la cantidad de caracteres utilizada.

# Versión 1.9.6 - Experiencia de verificación y resultados de coordinación (2026-08-29)

- Ordena el flujo para elegir el tipo de análisis antes de aportar el contenido.
- Añade accesos específicos para verificar afirmaciones, comparar cuentas y auditar perfiles.
- Muestra en el informe las cuentas comparadas, publicaciones coincidentes, cronología y evidencia de automatización.
- Activa automáticamente la investigación profunda al comparar cuentas.
- Mejora las instrucciones móviles para aportar tres o más enlaces o capturas identificables.

# Versión 1.9.5 - Auditoría comparativa de cuentas (2026-08-29)

- Localiza publicaciones exactas, casi exactas y paráfrasis, y registra sus URLs y cronología.
- Audita cada cuenta por separado usando señales de actividad, repetición, temporalidad y automatización.
- Distingue coordinación humana, comportamiento compatible con automatización y bots con alta confianza.
- Impide identificar bots únicamente por nombres genéricos, anonimato, ideología o una sola coincidencia.
- Exige al menos tres cuentas individualmente sustentadas para afirmar una granja de bots.

# Versión 1.9.4 - Corrección del límite de respuesta (2026-08-27)

- Aumenta el límite de salida de 5,000 a 14,000 tokens en análisis rápido y de 8,000 a 20,000 en investigación profunda.
- Limita cada lista a cinco elementos y cada informe a cinco fuentes para evitar respuestas truncadas.
- Reduce repeticiones y textos de relleno sin eliminar las secciones de verificación.
- Sustituye el mensaje técnico `max_output_tokens` por una explicación comprensible para el usuario.

# Versión 1.9.3 - Coordinación, nado sincronizado y granjas de bots (2026-08-26)

- Compara textos, imágenes, hashtags, enlaces, errores compartidos y horarios para encontrar réplicas coordinadas.
- Distingue repetición partidista, coordinación humana probable, nado sincronizado demostrado y automatización.
- La etiqueta NADO SINCRONIZADO DE DESINFORMACIÓN exige una falsedad comprobada y evidencia coincidente de al menos tres emisores independientes.
- La etiqueta GRANJA DE BOTS DIFUNDIENDO DESINFORMACIÓN exige además señales observables de automatización con confianza alta.
- Refuerza el análisis de campañas que niegan imputaciones o datos de prueba para exculpar a una persona procesada.
- Aplica el mismo estándar probatorio a derecha, izquierda, gobiernos, oposiciones, medios y cuentas anónimas.

# Versión 1.9.2 - Separación entre atribución y veracidad (2026-08-26)

- Confirmar que una persona o partido difundió una afirmación ya no aumenta la veracidad de esa afirmación.
- Impide clasificar como parcialmente cierta una falsedad solo porque la atribución de la declaración sea correcta.
- Obliga a evaluar como afirmación principal el contenido investigado y a calificarlo como FALSO/FALSA cuando la evidencia lo contradiga.
- Añade un caso de control específico para narrativas de persecución política y negación de pruebas documentadas.

# Versión 1.9.1 - Afirmaciones judiciales y persecución política (2026-08-26)

- Separa situación procesal, existencia de imputaciones, datos de prueba, culpabilidad y supuesto móvil político.
- Marca como falsa la negación de acusaciones o pruebas cuando los registros judiciales documentan su existencia.
- Exige evidencia específica para sostener una persecución política; el respaldo partidista no basta.
- Mantiene la presunción de inocencia: una detención o vinculación a proceso no equivale a culpabilidad.
- Identifica propaganda o desinformación en defensas partidistas que niegan hechos procesales comprobables, sin condenar globalmente al partido.

# Versión 1.9.0 - Biblioteca editorial ampliada (2026-08-24)

- Se publicaron diez artículos originales adicionales sobre verificación, encuestas, estadísticas, documentos, financiamiento, imágenes generadas, fuentes, gráficas, campañas, promesas y correcciones.
- Se ampliaron los ocho artículos existentes con procedimientos y ejemplos prácticos.
- Cada artículo incluye autoría, fecha, fuentes y enlaces a contenidos relacionados.
- El sitio reúne ahora dieciocho artículos y una biblioteca editorial superior a siete mil palabras.

# Versión 1.8.4 - Corrección de rutas editoriales (2026-08-23)

- Se corrigió la regla de Vercel que entregaba error 404 en las nuevas URL canónicas de los artículos.
- Se añadió una recuperación alternativa del identificador del artículo desde la propia ruta solicitada.
- Se conservaron las redirecciones permanentes desde las URL editoriales anteriores.

# Versión 1.8.3 - Limpieza de recursos (2026-08-19)

- Se retiró una imagen residual de prueba que no estaba vinculada ni publicada en el sitio.
- Se conservaron únicamente los recursos gráficos propios necesarios para la identidad y la vista previa del sitio.

# Versión 1.8.2 - Indexación y URL canónicas (2026-08-19)

- Cada artículo se publica con una URL canónica individual renderizada desde el servidor.
- Las direcciones anteriores con `article.html?slug=` redirigen permanentemente a las nuevas URL.
- El sitemap y los enlaces internos utilizan exclusivamente las rutas canónicas.
- Se reforzó el descubrimiento de los ocho artículos y de la página Quiénes somos.

# Versión 1.8.1 - Informes resumidos (2026-08-13)

- El informe final muestra, copia, comparte, lee e imprime un máximo de cinco fuentes relevantes.
- Se priorizan fuentes oficiales, primarias, documentales, académicas y verificadores que sustentan la conclusión.
- Se limita a una sola página por red social y a dos fuentes por dominio para evitar listas repetitivas.

# Versión 1.8.0 - Contenido editorial para AdSense (2026-08-13)

- La portada incorpora contenido educativo y navegación editorial visible incluso antes de usar el verificador.
- Se publican ocho artículos originales con autor, fecha, fuentes y datos estructurados.
- Se amplían metodología, quiénes somos y preguntas frecuentes.
- Se añaden política editorial, procedimiento de correcciones, autores y responsabilidad editorial.
- El sitemap incluye las páginas editoriales y los artículos para facilitar su indexación.
- Se conservan Vercel, Analytics, Search Console, AdSense, Threads, TikTok, YouTube y el verificador.

# Versión 1.7.7 - Patrones dirigidos (2026-08-13)

- Identifica si las publicaciones se dirigen recurrentemente contra un gobierno, funcionario, institución, empresa o persona.
- Informa cuántas publicaciones fueron revisadas, cuántas apuntan al objetivo y qué periodo cubre la muestra.
- Distingue crítica recurrente, cobertura negativa sistemática, campaña de descrédito y ataque sistemático con desinformación.
- Fundamenta la clasificación con ejemplos concretos y recursos narrativos repetidos.

# Versión 1.7.6 - Auditoría parcial útil (2026-08-13)

- Un perfil de Threads o TikTok se reconoce también por la URL y por Captapi, aunque la extracción directa de la plataforma esté limitada.
- Si se recuperaron publicaciones, contexto o fuentes, la auditoría se muestra como analizada y nunca como un veredicto global de no verificable.
- Se eliminan fuentes duplicadas por URL o título y se exige relevancia directa para la cuenta o las publicaciones evaluadas.

# Versión 1.7.5 - Intencionalidad y daño (2026-08-13)

- Separa la falsedad de la intención de perjudicar a personas, gobiernos, instituciones o grupos.
- Clasifica la evidencia como daño intencional sustentado, indicios de intención o intención no demostrada.
- Revisa repetición después de correcciones, material previamente desmentido, recortes deliberados, objetivos sistemáticos, coordinación y vínculos financieros documentados.
- Muestra la evidencia concreta utilizada para inferir intención y evita atribuirla por una falsedad aislada.

# Versión 1.7.4 - Antecedentes y conflictos de interés (2026-08-13)

- Las auditorías de medios y periodistas investigan antecedentes documentados de montajes, falsedades, retractaciones, sanciones, sentencias, correcciones y desmentidos.
- Se revisan propiedad, financiamiento, contratos públicos y conflictos de interés cuando existen documentos verificables.
- Los patrones comprobados se expresan directamente, pero las acusaciones de pagos o mercenarismo requieren evidencia financiera o contractual.
- Los perfiles recuperan un contexto web intermedio para contrastar las publicaciones sin regresar al análisis excesivamente largo.

# Versión 1.7.3 - Auditoría de publicaciones (2026-08-13)

- Los perfiles ya no reciben un veredicto global de cierto o falso ni un porcentaje de credibilidad.
- La respuesta evalúa exclusivamente la muestra de publicaciones recuperadas: tendenciosidad, omisiones, manipulación y desinformación verificable.
- La alerta de bot solo aparece cuando coinciden evidencia observable de automatización y repetición de noticias falsas verificadas.

# Versión 1.7.2 - Estabilidad en análisis largos (2026-08-13)

- Los perfiles sociales usan búsqueda web de contexto reducido y no obligatoria para priorizar el análisis de las publicaciones recuperadas.
- Se establece un límite interno antes del máximo de Vercel para devolver siempre un error JSON comprensible si OpenAI tarda demasiado.
- Se elimina el reintento automático del navegador para impedir consultas duplicadas y consumo doble de créditos de Captapi/OpenAI.

# Versión 1.7.1 - Corrección de respuesta social (2026-08-13)

- Corrige la construcción de `extraccion_enlace` para que los resultados de Threads y TikTok puedan incorporar el resumen del conector sin interrumpir el análisis.
- Mantiene Captapi, YouTube, Vercel, Analytics, Search Console, AdSense y el verificador de enlaces.

# Versión 1.7.0 - Análisis de Threads y TikTok (2026-08-13)

- Integración opcional y privada con Captapi mediante `CAPTAPI_API_KEY`, limitada a Threads y TikTok para cuidar los créditos.
- Recuperación complementaria de perfiles y publicaciones públicas de Threads y TikTok.
- Para publicaciones individuales compatibles, intenta recuperar detalles, comentarios y transcripciones realmente disponibles.
- YouTube y las demás redes conservan la extracción existente y no consumen créditos de Captapi.
- Auditorías de perfil limitadas inicialmente a 20 publicaciones y comentarios a 20, con topes configurables de 50.
- Caché de 24 horas para reducir consumo en consultas repetidas.
- Fallos del proveedor externo no interrumpen el verificador: se mantiene la extracción directa y la búsqueda web.
- Se conservan Vercel, Analytics, Search Console, AdSense, canonical, verificación de Google y el Motor Antiamarillismo.

# Versión 1.6.3 - Recuperación ante respuestas transitorias de Vercel (2026-08-07)

- La interfaz reintenta una vez cuando Vercel devuelve HTML o un error HTTP 500, 502, 503 o 504 durante un análisis.
- Las respuestas HTML ya no se muestran como errores técnicos de JSON; si el fallo persiste, aparece una explicación clara en español.
- El endpoint de salud informa la versión correcta, sin exponer claves.
- Se conservan Search Console, la URL canónica, Analytics, AdSense, YouTube Data API y el verificador de enlaces.

# Versión 1.6.2 - Verificación de Search Console (2026-08-07)

- Se incorpora la etiqueta oficial de verificación de Google Search Console para la propiedad `https://www.laverdadincomoda.mx/`.
- Se mantienen la URL canónica y las configuraciones existentes de Vercel, Analytics, AdSense y verificación de enlaces.

# Versión 1.6.1 - URL canónica para Search Console (2026-08-07)

- La página principal declara `https://www.laverdadincomoda.mx/` como URL canónica.
- Se conserva la redirección del dominio sin `www` y la configuración de Vercel, Analytics, Search Console, AdSense y verificación de enlaces.

# Cambios v2.1

## Corrección principal
El error HTTP 429 se trata como un estado técnico y no como evidencia sobre la veracidad de una publicación.

## Respuesta nueva
- `credibilidad: null`
- `confianza: null`
- `estado_tecnico`
- `acciones_disponibles`
- `reintentar`

## Compatibilidad
El endpoint conserva los campos anteriores y añade campos auxiliares. La interfaz debe comprobar `null` antes de añadir el símbolo `%`.
# Versión 1.4.0 — contexto profundo de enlaces y redes

- YouTube: extracción ampliada de título, canal, descripción, fecha, subtítulos y estadísticas disponibles.
- Comentarios de YouTube: muestra pública de hasta 50 comentarios relevantes mediante YouTube Data API v3 cuando existe `YOUTUBE_API_KEY`.
- Redes sociales y páginas: lectura de metadatos y JSON-LD, incluidos comentarios realmente publicados en datos estructurados.
- Informe visible: nueva sección de contexto recuperado, muestra de comentarios, tendencias, representatividad y posibles señales de coordinación.
- Salvaguardas: los comentarios no se tratan como prueba de verdad ni como muestra representativa; los datos relevantes se verifican mediante búsqueda web.
- Corrección de coherencia: `PARCIALMENTE VERDADERO` ahora corresponde a `PARCIALMENTE CIERTA`.
# Versión 1.5.0 - Videos largos y contexto (2026-08-06)

- Recuperación reforzada de subtítulos de YouTube mediante datos del reproductor y ruta alternativa de YouTube.
- Transcripciones con marcas de tiempo y mayor capacidad para programas extensos.
- Resumen completo, segmentación temática y verificación diferenciada de las afirmaciones principales.
- Un noticiero con varios temas ya no recibe automáticamente un único porcentaje de credibilidad.
- La credibilidad aparece como "No aplica" cuando no existe una afirmación global única; nunca como 0% por falta de una afirmación indicada por el usuario.
- Los comentarios continúan tratándose como contexto social y no como evidencia de veracidad.
- Se conserva la configuración existente de Vercel, Analytics, Search Console, AdSense y verificación de enlaces.
# Versión 1.6.0 - Perfiles sociales y recuperación de conexión (2026-08-06)

- Los perfiles completos de Threads y otras redes se tratan como auditorías de perfil, no como afirmaciones individuales.
- Se conservan y analizan nombre, usuario, biografía, seguidores y volumen declarado de publicaciones cuando la plataforma limita el historial completo.
- La búsqueda web para enlaces es obligatoria y usa consultas específicas del usuario y de la plataforma.
- El acceso parcial ya no borra los hallazgos verificables ni fuerza automáticamente un resultado vacío de “sin acceso”.
- Se excluyen del informe las fuentes exploratorias que no fueron seleccionadas o citadas como relevantes.
- La interfaz reintenta una vez los fallos transitorios de red y sustituye “Failed to fetch” por una explicación útil en español.
- La función de análisis admite hasta 300 segundos en plataformas Vercel compatibles.
- El endpoint de salud informa si las claves de OpenAI y YouTube están configuradas, sin exponer sus valores.
