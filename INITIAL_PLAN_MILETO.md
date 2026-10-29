# Plan maestro: app de emprendimiento para niños y jóvenes

Oct 28, 2026 · @Victor

## Visión y alcance

Una app de misiones que acompaña a niños y jóvenes desde "no sé qué vender" hasta vender, medir y aprender, con juegos, voz y cámara. Nombre: **Mileto (la mascota es una aceituna, por Tales de Mileto**). Tema del hackathon: *Build for Your World*. Categoría: desarrollador independiente; equipo opcional de hasta 4.

**Problema (hipótesis a validar con un docente).** Los niños de pueblo casi no tienen quién los guíe para convertir una idea en ingreso. En 101 post-mortems de startups analizados por CB Insights, la razón más citada fue "no había necesidad en el mercado" (42%). Por eso la app obliga a validar antes de comprar.

**Usuarios.** Primarios: niños de 8 a 12 y jóvenes de 13 a 18, con un celular compartido y conexión intermitente. Secundario: el docente, que ve el progreso del grupo.

**Propuesta de valor**

- Camino completo de emprender: idea, validar, planear, probar, ponerle marca, promocionar, vender, llevar cuentas, decidir y volver a empezar.
- Misiones reales verificadas con cámara y voz, no solo preguntas de opción múltiple.
- Todas las cuentas las hace código; el modelo conversa y lee fotos y voz.
- Progreso estilo Duolingo, pero amable: sin ligas y sin miedo a perder la racha.

**Dentro del MVP**

- App para iPhone (React Native con Expo) y servidor Express. Tres entradas (sin idea, con idea, ya vende) y un mapa de camino con tres mundos.
- Mascota con voz, lecciones de 2 minutos con juego y analogía.
- Misiones con cámara y voz: inventario, precios, caja y entrevistas; marca, promoción y ventas con un cliente simulado.
- Progreso visible y un panel simple para el docente con datos de ejemplo.

**Fuera del MVP**

- Ligas, tablas de posiciones, pagos reales y cuentas bancarias.
- Chat abierto con el modelo y consejos financieros personalizados.
- Android, publicación en la App Store, hardware propio y publicar en redes sociales desde la app.

## Reglas del hackathon y criterios del jurado

La entrega vence el miércoles 4 de noviembre a las 9:00 PM ET. La meta interna es enviar el martes 3 y dejar el miércoles como margen.

| Regla | Qué implica para nosotros |
| --- | --- |
| Repositorio público | Sin claves en el código y con un README claro |
| Solo trabajo hecho durante el evento | Commits desde hoy; no reutilizar proyectos previos |
| Video de 3 minutos | Es el artefacto principal del jurado; ver Entregables |
| Equipos de hasta 4 | Buscar un compañero de diseño y video en #team-search |
| $150 en créditos de Meta Model API | Reclamar antes del 4 de nov. 9:00 PM ET; exige tarjeta, así que poner límite de gasto |
| Usar modelos de Meta | Muse Spark, Voice Transcribe, SAM 3.1 y Muse Image por Meta Model API |
| Proyectos prohibidos | Consejos médicos, RAG básico, analizadores simples de imagen, chatbots simples de educación, política o guerra |

La guía descarta los "chatbots simples de educación". Nuestra defensa: un agente con misiones verificadas por cámara y voz, cuentas calculadas con código y un ciclo de progreso, no un chat de preguntas y respuestas.

**Cómo califica el jurado.** La etapa 1 es pasa o no pasa: encajar con el tema y usar de verdad los modelos de Meta. La etapa 2 puntúa de 0 a 10:

| Criterio | Peso | Cómo lo cubrimos |
| --- | --- | --- |
| Impacto | 30% | Niños y jóvenes de pueblo; encaja con la formación en emprendimiento que exige la Ley 1014 de 2006 |
| Uso de herramientas de Meta | 25% | Voz, visión, SAM, generación de imagen y agente en un mismo flujo |
| Profundidad técnica | 20% | Cálculo verificado con código y precisión medida en pruebas |
| Demo | 25% | Caso de Mateo y el jugo, de principio a fin |

**Premios extra a los que apuntar:** Best Agentic Use-Case ($5K), Best Creative Build ($5K, con Muse Image) y Community Vote ($10K). Opcionales: Best Build on Meta Open Weight Models ($10K) y Most Viral ($20K, con una publicación en X).

## Usuarios y requisitos

Hay 24 requisitos funcionales; 14 son imprescindibles (Must) para el video del 3 de noviembre. Cada uno tiene un ID para referenciarlo en pruebas y commits.

**Historias de usuario**

- Como niño que no sabe qué vender, quiero que la mascota me ayude a encontrar una idea con lo que tengo.
- Como joven con una idea, quiero comprobar si alguien la compraría antes de gastar mi dinero.
- Como niño que vende, quiero practicar con un cliente simulado que me diga “está caro” para aprender a responder sin miedo.
- Como joven con un negocio, quiero darlo a conocer sin gastar mucho y saber qué acción funcionó.
- Como niño que ya vende, quiero que la cámara cuente mis ventas y me muestre mi ganancia.
- Como docente, quiero ver en qué paso se atascó cada estudiante para reforzarlo en clase.

**Requisitos funcionales**

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-01 | Entrar sin cuenta: apodo, avatar y código de clase opcional | Must |
| RF-02 | Aviso para un adulto antes de activar cámara y micrófono | Must |
| RF-03 | Pantalla de entrada con tres caminos: sin idea, con idea, ya vende | Must |
| RF-04 | Mapa con tres mundos y niveles que se desbloquean | Must |
| RF-05 | Mascota con voz que guía y hace preguntas | Must |
| RF-06 | Descubrir y elegir idea, con chequeo de cuatro preguntas | Must |
| RF-07 | Círculo de oro que termina en una tarjeta del negocio | Must |
| RF-08 | Validar mercado: guion de entrevistas, grabación por voz y resumen | Must |
| RF-09 | Planear compras y comparar precios de dos tiendas por foto | Must |
| RF-10 | Costo, precio y ganancia calculados con código | Must |
| RF-11 | Caja: foto de apertura y cierre, conteo y cruce con la nota de voz | Must |
| RF-12 | Conteo de monedas con la cámara | Should |
| RF-13 | Decisión de reinversión con escenarios simulados | Must |
| RF-14 | Pitch por voz con retroalimentación de la mascota | Should |
| RF-15 | Progreso: huerta que crece, semillas, racha amable, medallas, libro de aprendizajes | Must |
| RF-16 | Panel del docente con datos de ejemplo | Should |
| RF-17 | Afiche del negocio generado con Muse Image | Should |
| RF-18 | Salida imprimible de misiones y afiche | Could |
| RF-19 | Funcionamiento parcial sin conexión | Could |
| RF-20 | Marca y promoción: nombre, eslogan, tres acciones para darse a conocer y conteo de “¿cómo te enteraste?” | Should |
| RF-21 | Ventas: practicar por voz con un cliente simulado que pone objeciones y recibir retroalimentación | Must |
| RF-22 | Tarjeta de sellos para clientes que vuelven | Could |
| RF-23 | Dos frascos: separar la plata del negocio y la personal | Should |
| RF-24 | Módulos de crecimiento: equipo y roles, proveedores, calidad y ética | Could |

**Requisitos no funcionales**

- RNF-01: app para iPhone hecha con React Native (Expo), con diseño pensado primero para pantallas de celular.
- RNF-02: voz en todas las pantallas; lectura mínima y frases cortas en español.
- RNF-03: ningún cálculo lo hace el modelo; todo número sale de código.
- RNF-04: datos de menores mínimos: sin nombre real, correo ni ubicación.
- RNF-05: respuesta de la mascota en menos de 5 segundos como objetivo, a medir.
- RNF-06: repositorio público sin claves ni datos reales de niños.
- RNF-07: las claves de Meta viven solo en el servidor Express, nunca dentro de la app.

## Especificación del producto: el camino

&#91;embedded content: camino del emprendedor · 12 fases, 3 mundos, 1 ciclo\]

Las tres entradas llevan al mismo camino de doce fases; al terminar la fase 12, lo aprendido vuelve a la fase 4 para ajustar la idea. Cada fase tiene una misión real y una forma de verificarla.

| Fase | Misión real | Se verifica con |
| --- | --- | --- |
| 1. Descubrir | Contar qué sabe hacer y qué tiene a mano | Voz transcrita y resumida por el modelo |
| 2. Elegir | Responder cuatro preguntas sobre su idea | Reglas del chequeo, en código |
| 3. Círculo de oro | Decir por qué, cómo y qué | Tarjeta del negocio que el niño confirma |
| 4. Validar | Cinco mini-entrevistas | Transcripción y conteo por código |
| 5. Compras | Lista de materiales y dos tiendas comparadas | Foto de etiquetas o recibos y confirmación |
| 6. Capital | Decidir con qué plata empieza y separar la plata del negocio de la personal | Registro del niño y dos frascos, sin deudas por defecto |
| 7. Prueba | Hacer una tanda pequeña y pedir opinión | Foto del producto y notas de voz |
| 8. Precio | Fijar precio con sus costos y lo que cobra la competencia | Cálculo en código |
| 9. Marca y promoción | Ponerle nombre y eslogan, hacer el afiche y elegir tres acciones para darse a conocer: boca a boca, muestra gratis y afiche | Afiche (Muse Image o foto) y conteo de “¿cómo te enteraste?” |
| 10. Ventas | Practicar con un cliente simulado y vender de verdad | Rúbrica en código sobre la conversación por voz y registro de ventas |
| 11. Caja | Foto de apertura y cierre, y monedas | SAM, confirmación y cruce con la voz |
| 12. Decidir y pitch | Elegir reinversión y presentar su negocio | Simulación en código y pitch por voz |

**Módulos de crecimiento.** Se abren después del primer ciclo; en el hackathon solo aparecen en el mapa.

- Clientes que vuelven: buen servicio y tarjeta de sellos.
- Proveedores: pedir precio a dos y negociar por voz.
- Equipo y roles: compras, ventas y cuentas en grupos de 3 o 4.
- Calidad, ética e impacto: cuidar el producto, a las personas y al ambiente.
- Ampliar: un segundo producto con lo aprendido.

## Pedagogía y gamificación

Cada nivel sigue el mismo ritmo: una microlección de 2 minutos con una analogía, un mini-juego para practicar y una misión real que se verifica con cámara o voz. Los tres mundos siguen las tres áreas del marco europeo EntreComp, adaptadas por nosotros para niños.

| Mundo | Qué aprende el niño | Fases |
| --- | --- | --- |
| La Semilla (ideas) | Ver oportunidades, crear, valorar su idea, pensar en el efecto en otros | 1 a 4 |
| La Alforja (recursos) | Qué necesita, cuánto cuesta, de dónde sale la plata y cómo separar la del negocio de la personal | 5, 6 y 8 |
| La Plaza (en acción) | Probar en pequeño, darse a conocer, vender, llevar cuentas, afrontar el riesgo y aprender de los errores | 7 y 9 a 12 |

**Analogías y juegos**

| Concepto | Analogía | Mini-juego | Misión real |
| --- | --- | --- | --- |
| Idea | Una semilla: aún no es planta | Elegir semillas según la tierra | Contar su idea por voz |
| Validar | Preguntarle al terreno si deja crecer | Detective de clientes | 5 mini-entrevistas |
| Producto mínimo | Probar la sopa antes de echar toda la sal | Tanda pequeña o grande | Una tanda de prueba |
| Ajuste al cliente | El zapato que le queda al pie | Probar zapatos de varias medidas | Pedir opiniones |
| Costo y precio | Una balanza | Equilibrar con un deslizador | Foto de recibos |
| Marca | La camiseta del equipo: te reconocen de lejos | Elegir nombre, colores y eslogan | Hacer y pegar su afiche |
| Promoción | El pregón en la plaza | Pregonero: grabar un pregón de 15 segundos y ver si dijo qué vende, para quién y a qué precio | Probar tres acciones y contar cómo se enteró cada cliente |
| Venta | Ser buen anfitrión: escuchar antes de ofrecer | Cliente difícil: responder objeciones por voz, como “está caro” | Vender cinco unidades |
| Cliente que vuelve | La tarjeta de sellos | Armar su tarjeta de sellos | Entregarla a sus clientes |
| Plata del negocio y personal | Dos frascos: el del negocio no se toca para dulces | Repartir una ganancia en dos frascos | Separar su plata real en dos frascos |
| Reinvertir | Guardar semillas de la cosecha | Repartir la cosecha en frascos | Decidir qué hacer con su ganancia |
| Equipo | Un equipo de fútbol: cada uno en su puesto | Repartir roles de compras, ventas y cuentas | Trabajar en equipo una semana |
| Riesgo | Cruzar el río por las piedras | Elegir el camino | Nombrar un riesgo de su negocio |
| Errar | Tropezar con el balón y aprender a patear | Convertir un fallo en una pista | Mi tropiezo de la semana |

**Progreso (estilo Duolingo, versión amable)**

- Mapa con niveles que se desbloquean: Semilla, Brote, Planta y Árbol.
- Una huerta o puesto que crece con cada misión cumplida.
- Racha con días de gracia incluidos y sin castigo por faltar. Duolingo [reporta](https://blog.duolingo.com/how-duolingo-streak-builds-habit) que quienes llegan a 7 días de racha tienen 3,6 veces más probabilidad de terminar el curso; es una cifra de la empresa, sin causalidad probada. Usamos la racha, pero no el miedo a perderla.
- Medallas por hábitos reales: Detective de clientes, Cuentas claras y Tropiezo valiente, que premia aprender de un error.
- Libro de aprendizajes: la mascota guarda lo que salió mal y lo convierte en pista.

**Reglas de tono para la mascota**

- Frases cortas, humor suave y modismos de la región; personaje original, sin parecerse a ninguna mascota existente.
- Preguntas ingenuas ("¿y por qué cobras eso?") en vez de sermones.
- Nunca da un consejo financiero personal ni recomienda un producto real.

**Ficha del personaje: Mileto, la aceituna**

- Quién es: una aceituna pequeña con una hoja en la cabeza. Su nombre viene de Tales de Mileto, quien según la tradición recogida por Aristóteles previó una buena cosecha de aceituna y alquiló las prensas antes que nadie. Al contarlo en la app y en el video se dice "según se cuenta".
- Personalidad: curiosa, optimista y algo distraída. Pregunta más de lo que afirma ("¿cómo sabes que alguien lo compraría?"), que es el hábito que enseña la app.
- La hoja muestra el ánimo: se levanta ante una idea, se dobla con un tropiezo y brota con cada logro, y se conecta con la huerta de progreso.
- Frase de cabecera: "Primero miramos, luego decidimos" (validar antes de gastar).
- Ante un error: "¡Buen tropiezo! Ahora sabemos algo nuevo"; da la medalla Tropiezo valiente y guarda la pista en el libro de aprendizajes.
- Origen en la historia: Mileto "viene de lejos" y aprende del mercado de cada pueblo, porque la aceituna no es una fruta de uso diario en muchos pueblos de Colombia.
- Límites: no se burla, no promete ganancias, no da consejos financieros personales y marca como hipótesis toda estimación.
- Diseño: personaje original dibujado desde cero (apoyo posible: Muse Image), sin parecerse a ninguna mascota existente.
- Pendiente: probar con niños reales que el nombre Mileto y el personaje se entienden, y comprobar que el nombre está libre en GitHub, en el App Store y como marca.

## Arquitectura y uso de los modelos de Meta

&#91;embedded content: arquitectura · celular, servidor, modelos de Meta y datos\]

El celular solo captura fotos y voz; el servidor llama a los modelos de Meta, valida lo que devuelven y hace todas las cuentas en código antes de guardar y mostrar el resultado.

**Decisiones técnicas**

- **App:** React Native con Expo (TypeScript), para iPhone. Con Expo Go se prueba en un iPhone real sin pagar la cuenta de Apple Developer; compilar para TestFlight sí la exige. Expo trae módulos de cámara, grabación de audio y voz del sistema; confirmar nombres y versiones en su documentación el día 1.
- **Servidor:** Node con Express (TypeScript). Valida cada respuesta del modelo contra un esquema y es el único lugar donde viven las claves de Meta.
- **Datos:** una base simple (SQLite al principio) detrás del servidor.
- **Panel del docente:** página web sencilla que lee del mismo servidor.
- **Acceso del jurado:** además del video grabado en un iPhone, dejar un enlace para probar la app (Expo Go o TestFlight) y una versión web de respaldo.
- **Android:** el mismo código puede correr allí, pero no se prueba durante el hackathon.

| Modelo de Meta | Para qué se usa | Dónde | Si falla |
| --- | --- | --- | --- |
| Muse Spark | Leer fotos de recibos y etiquetas, resumir entrevistas, guiar a la mascota | F2, F3, F4 | El niño escribe o dicta el dato |
| Voice Transcribe | Pasar notas de voz y entrevistas a texto | F2, F4 | Confirmar cifras por voz o botones |
| SAM 3.1 | Separar y contar productos y monedas | F4 | Conteo por voz |
| Muse Image | Afiches y cómics del negocio | RF-17 | Plantilla de afiche simple |
| Muse Code | Programar más rápido durante el desarrollo | Desarrollo | No aplica |

Para el premio de modelos abiertos ($10K) se podría correr una parte con Muse Spark Open o Muse Glimmer; es opcional y solo si sobra tiempo. Para Baseten, la guía indica usar `meta-models/muse-spark-open-1026` en el hackathon.

## Modelo de datos y herramientas del agente

Todo dato numérico nace en código. El modelo devuelve JSON que se valida contra un esquema; si falla, reintenta una vez y después le pide al niño que confirme.

**Entidades**

| Entidad | Campos clave |
| --- | --- |
| Estudiante | id, apodo, avatar, rango de edad, código de clase, nivel, semillas, racha, días de gracia |
| Negocio | id, estudiante, idea, por qué, cómo, qué, fase actual |
| Validación | negocio, entrevistas (audio, transcripción, interés, precio dicho), resumen, decisión |
| Compra | negocio, ítems (nombre, cantidad, costo unitario, tienda), total |
| Tanda | negocio, unidades, costo total, costo unitario, fecha |
| Marca | negocio, nombre, eslogan, colores, afiche |
| Promoción | negocio, acción, fecha, clientes por origen (“¿cómo te enteraste?”) |
| Sesión de venta | negocio, escenario, objeciones, rúbrica (saludó, dijo el precio, respondió la objeción, cerró), mejoras |
| Caja del día | negocio, fecha, unidades al abrir, unidades al cerrar, vendidas por conteo, vendidas por voz, coincide, ingreso, monedas |
| Frascos | negocio, saldo del negocio, saldo personal |
| Misión | id, fase, tipo, estado, evidencia, verificada |
| Aprendizaje | negocio, tipo (tropiezo o acierto), texto, pista |
| Medalla | estudiante, tipo, fecha |
| Clase | código, docente (opcional) |

**Herramientas del agente**

| Herramienta | Entrada | Salida | La hace |
| --- | --- | --- | --- |
| transcribir\_voz | audio | texto | Voice Transcribe |
| leer\_foto | imagen y qué leer | JSON con ítems y precios | Muse Spark |
| contar\_objetos | imagen y objeto | cantidad y máscaras | SAM 3.1, con confirmación del niño |
| clasificar\_monedas | recortes de monedas | denominaciones | Muse Spark o regla por tamaño, a probar |
| resumir\_entrevistas | transcripciones | patrón de interés y rango de precios | Muse Spark; los promedios, con código |
| calcular\_costos | ítems, unidades, precio | costo unitario, ganancia, margen | código |
| simular\_escenarios | caja y opciones | ganancia proyectada por opción | código |
| generar\_afiche | nombre, eslogan, producto | imagen | Muse Image |
| crear\_marca | negocio y producto | tres nombres, eslóganes y colores propuestos | Muse Spark |
| simular\_cliente | escenario y voz del niño | respuesta del cliente, máximo tres turnos | Muse Spark con reglas de tono |
| evaluar\_venta | etiquetas de la conversación | puntaje por rúbrica fija | código; el modelo solo etiqueta |
| contar\_origen\_clientes | respuestas de “¿cómo te enteraste?” | conteo por acción de promoción | código |
| decidir\_pista | intento e historial | nivel de pista | reglas con apoyo del modelo |
| actualizar\_progreso | evento | semillas, racha, medallas | código |

## Especificaciones y criterios de aceptación

Cada funcionalidad se da por terminada cuando cumple sus criterios, escritos como Dado / Cuando / Entonces.

### F1. Tres entradas (RF-03, RF-06, RF-07)

- Dado un estudiante nuevo que elige "No sé qué hacer", cuando termina las preguntas, entonces recibe tres ideas semilla y avanza a la fase 2.
- Dado uno que elige "Ya tengo una idea", cuando responde el chequeo de cuatro preguntas, entonces entra en la fase 4 y las fases 1 a 3 quedan marcadas como saltadas y repasables.
- Dado uno que elige "Ya vendo algo", cuando describe su negocio, entonces entra en la fase 11 (caja) tras un chequeo corto de costos.
- La validación de mercado (fase 4) no se puede saltar en ningún camino.

### F2. Validar el mercado (RF-08)

- Dado el guion de cinco preguntas, cuando el niño graba al menos tres entrevistas, entonces cada una se transcribe y se resume cuántas personas dicen que comprarían y en qué rango de precio; el conteo y el rango los calcula el código.
- Si menos de la mitad muestra interés (umbral inicial, a ajustar), la mascota propone ajustar o cambiar la idea, con lenguaje de aprendizaje y nunca de fracaso.

### F3. Comparar precios por foto (RF-09)

- Dado dos fotos de etiquetas o recibos, cuando el modelo extrae ítems y precios, entonces el niño confirma cada valor antes de seguir.
- El código calcula el precio por unidad y señala la tienda más barata.
- Si la lectura es dudosa, la app pide el dato por voz en lugar de adivinar.

### F4. Caja con cámara (RF-11, RF-12)

- Dado una foto al abrir y otra al cerrar, cuando SAM cuenta los productos, entonces la mascota pregunta "veo 20, ¿es correcto?" y el niño confirma o corrige.
- Las ventas son apertura menos cierre; el ingreso es ventas por precio, calculado con código.
- Si coincide con la nota de voz del niño, gana la medalla Cuentas claras; si no, la mascota pregunta qué pasó, sin regaño.

### F5. Reinvertir (RF-13)

- Dado la caja de la semana, cuando el niño abre la decisión, entonces ve tres escenarios (repetir, cambiar el precio, guardar parte) con sus supuestos visibles.
- La app los presenta como hipótesis, no como promesas, y guarda la decisión elegida y su resultado la semana siguiente.

### F6. Progreso (RF-15)

- Cada misión cumplida da semillas y hace crecer la huerta.
- La racha cuenta los días con al menos una misión; incluye dos días de gracia por semana y no resta nada al faltar.
- No hay notificaciones insistentes ni tablas de posiciones.

### F7. Aviso para un adulto (RF-02)

- Cámara y micrófono permanecen bloqueados hasta que un adulto marque la casilla de acompañamiento.

### F8. Marca y promoción (RF-17, RF-20)

- Dado un negocio validado, cuando el niño elige entre tres nombres y eslóganes propuestos o escribe el suyo, entonces la app guarda su marca y genera un afiche con Muse Image.
- El afiche nunca incluye teléfono, dirección, colegio ni nombre real del niño; la app lo revisa antes de mostrarlo.
- Dado que el niño elige tres acciones para darse a conocer (boca a boca, muestra gratis, afiche), cuando vende, entonces anota por voz cómo se enteró cada cliente y el código cuenta qué acción funcionó mejor.
- La app no publica nada en redes sociales; si el niño quiere hacerlo, la mascota le pide acompañamiento de un adulto.

### F9. Ventas con cliente simulado (RF-21)

- Dado un escenario (por ejemplo “está caro” o “no tengo plata hoy”), cuando el niño responde por voz, entonces el cliente simulado contesta en un tono amable y apropiado para su edad, con tres turnos como máximo.
- El modelo solo etiqueta la conversación (¿saludó?, ¿dijo el precio?, ¿respondió la objeción?, ¿cerró?); el puntaje lo calcula el código con una rúbrica fija.
- La mascota señala un acierto y una mejora, nunca una nota baja, y deja repetir el escenario.

### F10. Dos frascos (RF-23)

- Dado una ganancia registrada, cuando el niño la reparte, entonces la app separa lo que vuelve al negocio de lo que es suyo y muestra cómo crece cada frasco.

## Seguridad infantil, privacidad y ética

La app trata a menores, así que estas reglas valen más que cualquier función. Se cumplen en el código y se muestran en el README.

- **Datos mínimos.** Solo apodo, avatar y rango de edad. Sin nombre real, correo ni ubicación.
- **Adulto presente.** Cámara y micrófono se activan solo después de que un adulto o docente lo autorice (RF-02).
- **Fotos y audio.** Se procesan y se descarta la evidencia al confirmar; se guardan solo los resultados (cantidades, precios).
- **Sin dinero real.** La app registra y simula; no hay pagos ni cuentas bancarias. Si hay dinero real en un negocio, lo supervisa un adulto.
- **Productos seguros.** Si la idea implica comida o herramientas, la app lo marca y pide acompañamiento adulto. No afirma requisitos legales que no haya verificado.
- **Entrevistas.** Solo con personas conocidas y con un adulto cerca; nunca con desconocidos.
- **Límites del modelo.** No da consejos financieros personales, médicos ni políticos, ni recomienda productos financieros reales. Los números siempre vienen de código.
- **Diseño sin manipulación.** Sin notificaciones insistentes, sin cajas sorpresa y sin castigo por faltar.
- **Honestidad.** La app etiqueta lo estimado como hipótesis.
- **Datos del video y del repositorio.** Solo datos de ejemplo, adultos o manos en cámara, o menores con permiso escrito de sus padres.
- **Normativa.** Antes de usarla con niños reales, revisar la ley colombiana de datos personales de menores con un asesor (por ejemplo, la Ley 1581 de 2012; no verificada para este plan).

**Marketing y ventas**

- Nada se publica en redes sociales desde la app.
- Afiches y marcas sin datos personales de menores: sin teléfono, dirección, colegio ni nombre real.
- El cliente simulado nunca pide datos personales, no insulta y mantiene un tono apropiado para la edad; si el niño muestra malestar, la conversación se corta y la mascota sugiere hablar con un adulto.
- Las ventas reales se hacen con personas conocidas y con un adulto cerca.

## Plan de pruebas y evaluación

Las pruebas de riesgo se hacen primero, antes de construir pantallas. Las metas son propuestas iniciales; se ajustan tras la primera medición y los resultados van al README y al video.

| Prueba | Cómo se mide | Meta inicial | Si falla |
| --- | --- | --- | --- |
| Conteo de objetos | 20 fotos de naranjas o vasos sobre mesa lisa, conteo contra realidad | 90% exacto | Confirmación obligatoria o conteo por voz |
| Monedas | 20 fotos con monedas colombianas | 90% por denominación | El niño dice cuántas hay |
| Lectura de recibo o etiqueta | 15 fotos | 90% de precios correctos | Confirmar cada valor |
| Voz en español colombiano | 20 notas con acentos distintos | 90% de cifras correctas | Confirmar cifras por voz o botones |
| Cálculos | 30 casos con tests automáticos | 100% | Corregir el código |
| Límites del modelo | 20 pedidos de riesgo (“dame un préstamo”, “qué acciones compro”) | 0 consejos personales | Endurecer instrucciones y filtro |
| Cliente simulado | 20 conversaciones de prueba, con intentos de sacarlo del guion | 0 respuestas fuera de tono o que pidan datos personales | Endurecer instrucciones, limitar turnos y cortar la conversación |
| Afiche y marca | 20 afiches generados | 0 con datos personales o texto ilegible | Revisar el texto antes de mostrarlo y usar una plantilla |
| Tiempo de respuesta | 20 interacciones | Menos de 5 s | Respuestas más cortas y animación de espera |
| Prueba con personas | 2 o 3 jóvenes o docentes, con permiso | Terminan el primer nivel sin ayuda | Ajustar lenguaje y mascota |

## Cronograma día a día

&#91;embedded content: cronograma · 28 de octubre al 4 de noviembre\]

Cada día termina con un resultado comprobable; si el viernes 30 una fase va atrasada, se recorta antes de empezar la siguiente.

| Día | Tareas | Listo cuando |
| --- | --- | --- |
| Mié 28 (noche) | Reclamar créditos y poner límite de gasto; crear el repo público con README mínimo; crear el proyecto Expo y el servidor Express; probar la app en un iPhone con Expo Go; pruebas de riesgo de voz, recibo y conteo | Resultados escritos, app corriendo en el iPhone y decisión de seguir o ajustar |
| Jue 29 | Mascota y voz; entrada sin cuenta con aviso a un adulto (RF-01, RF-02, RF-05); tres entradas (RF-03); fases 1 a 3 (RF-06, RF-07) | Un niño nuevo llega a su tarjeta del negocio |
| Vie 30 | Entrevistas por voz y resumen (RF-08); comparar precios por foto (RF-09); hablar con un docente | Entrevistas resumidas y precios comparados con confirmación; **decisión de recorte** |
| Sáb 31 | Costos y precio en código (RF-10); marca, afiche y promoción (RF-17, RF-20); caja con SAM y cruce con la voz (RF-11) | La caja del niño del jugo funciona de punta a punta y tiene su afiche |
| Dom 1 nov | Ventas con cliente simulado (RF-21); reinversión y dos frascos (RF-13, RF-23); huerta, racha y medallas (RF-15) | Camino completo con datos de ejemplo |
| Lun 2 | Monedas (RF-12); pitch por voz (RF-14); panel del docente (RF-16); pulir diseño y lenguaje; probar con 2 o 3 personas; medir precisión | Tabla de resultados completa |
| Mar 3 | Grabar el video de 3 minutos, terminar el README, preparar el enlace de prueba para el jurado, revisar la lista de entrega y enviar | Entrega enviada |
| Mié 4 | Margen y correcciones; envío antes de las 9:00 PM ET | Confirmación de envío |

## Riesgos y planes B

Los tres riesgos que más pueden hundir la demo son el alcance, la voz y el conteo con cámara.

| Riesgo | Probabilidad | Plan B |
| --- | --- | --- |
| Alcance demasiado grande | Alta | Mapa completo, pero solo seis fases a fondo; recorte decidido el viernes 30 |
| Un solo desarrollador | Alta | Buscar un compañero en #team-search; documentar a diario |
| Conteo con SAM falla en pilas o con mala luz | Media | Objetos separados sobre mesa lisa, confirmación del niño y conteo por voz |
| La voz no reconoce acentos | Media | Confirmar cifras por voz o con botones |
| Latencia alta | Media | Respuestas cortas, animaciones de espera y demo grabada |
| Los jueces no pueden probar la app en iPhone | Media | Video grabado en iPhone, enlace de Expo Go o TestFlight y versión web de respaldo |
| Parecer un chatbot educativo simple | Media | Mostrar en el video misiones con cámara, verificación con código y progreso |
| Niños en el video | Media | Solo adultos o manos; permiso escrito si hay menores |
| Expo Go no admite algo que necesitamos | Baja | Probarlo el día 1; si falla, otra vía de compilación (puede exigir cuenta de Apple Developer) o la versión web |
| El cliente simulado responde fuera de tono | Baja | Reglas de tono, máximo tres turnos y corte de la conversación |
| Créditos de $150 insuficientes | Baja | Cachear respuestas, límite de gasto y datos de ejemplo |
| Números inventados por el modelo | Baja | Todo número por código y salida en JSON validado |
| Falla el servicio durante la demo | Baja | Video grabado con tomas de respaldo |

## Entregables: repositorio, video y pitch

El jurado verá sobre todo el video de 3 minutos, el código y el producto en vivo, así que los tres deben contar la misma historia.

**Frase del pitch.** Mileto enseña a emprender haciendo: cada misión se verifica con la cámara y la voz, y cada número lo calcula código, no un chatbot.

**Lo que el niño aprende (el centro del pitch)**

- A ver oportunidades y elegir una idea con criterio.
- A validar con clientes antes de gastar.
- A probar en pequeño y ajustar.
- A entender costo, precio y ganancia con sus propios números.
- A darse a conocer y a vender escuchando al cliente.
- A separar la plata del negocio de la personal.
- A decidir si reinvierte, ahorra o cambia.
- A aprender de los errores y volver a empezar.

**Guion del video (3:00)**

| Tiempo | Escena |
| --- | --- |
| 0:00 a 0:20 | Gancho: un joven con una idea y el problema de construir sin preguntar |
| 0:20 a 0:45 | La mascota y las tres entradas; el mapa de tres mundos |
| 0:45 a 1:15 | Validar con entrevistas por voz y comparar precios con la cámara |
| 1:15 a 1:45 | Marca y afiche con Muse Image, y venta con un cliente simulado por voz |
| 1:45 a 2:20 | Caja: foto de apertura y cierre, SAM cuenta, cruce con la voz, medalla |
| 2:20 a 2:40 | Reinvertir, dos frascos, huerta que crece y Tropiezo valiente |
| 2:40 a 3:00 | Panel del docente, impacto, qué se construyó en el hackathon y cierre |

**Lista de entrega**

- [ ] Repositorio público sin claves, con licencia y datos de ejemplo
- [ ] README con problema, solución, modelos de Meta usados, cómo ejecutar y límites conocidos
- [ ] Sección "Qué se construyó durante el hackathon" con commits desde el 28 de octubre
- [ ] Resultados de las pruebas de precisión en el README
- [ ] Video de 3 minutos con enlace accesible
- [ ] Enlace para que el jurado pruebe la app (Expo Go o TestFlight) y versión web de respaldo
- [ ] Todas las personas del proyecto listadas en la plataforma
- [ ] Créditos de Meta reclamados por cada integrante
- [ ] Opcional: publicación del demo en X para el premio Most Viral

## Definición de terminado, supuestos y fuentes

El proyecto está listo para enviar cuando se cumple todo lo siguiente.

- [ ] Un negocio de ejemplo (el niño del jugo) recorre el camino de principio a fin sin errores
- [ ] Las 14 funciones Must (RF-01 a RF-11, RF-13, RF-15 y RF-21) cumplen sus criterios
- [ ] Todos los números mostrados salen de código y tienen pruebas
- [ ] Los conteos y las lecturas muestran confirmación del niño
- [ ] Las pruebas de la sección anterior tienen resultados escritos
- [ ] Ningún dato real de menores en el repositorio ni en el video
- [ ] Video, README y repositorio enviados antes del 4 de noviembre, 9:00 PM ET

**Supuestos por validar**

- Que los niños de pueblo no tienen quién los guíe para emprender: hablar con un docente esta semana.
- Que las analogías y el tono de la mascota funcionan con niños reales.
- Qué admite exactamente SAM 3.1 (imagen, video, indicaciones por texto): confirmar en la documentación.
- Que Voice Transcribe entiende bien el español colombiano.
- Que Expo Go alcanza para la demo en iPhone y que el jurado puede probar la app con un enlace.
- Que un cliente simulado por voz se siente natural para niños: probarlo con 2 o 3 personas.
- Que el celular compartido es realista: en 2021 solo el 28,8% de los hogares de centros poblados y zonas rurales tenía internet, según DANE reportado por DPL News. Las cifras pueden haber cambiado.
- Que la Ley 1014 de 2006 sigue vigente en esos términos: el texto consultado no indica modificaciones posteriores.

**Fuentes** (consultadas el 28 de octubre de 2026)

- [Meta Global AI Developer Hackathon, página del evento](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) y la guía del participante que compartiste
- [EntreComp: guía del marco europeo](https://sni.unioncamere.it/sites/default/files/approfondimento/documenti/Entrecomp%20Guide%20EN.pdf)
- [Ley 1014 de 2006](https://ugpp.gov.co/sites/default/files/documentos/Ley-1014-2006.pdf)
- [CB Insights: razones de fracaso de startups, vía StartupNews](https://startupnews.com.au/news/top-20-reasons-startups-fail-cb-insights/)
- [Duolingo: cómo la racha crea hábito](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- [MIT: proceso de desarrollo de un modelo de negocio (Blank y Ries)](https://orbit-kb.mit.edu/hc/en-us/articles/213100323-What-process-should-entrepreneurs-follow-in-developing-their-business-model)
- [DPL News: acceso a internet rural en Colombia, datos de DANE 2021](https://dplnews.com/?p=160925)
