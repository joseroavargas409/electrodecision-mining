# Referencias de flotas de minas chilenas

Investigación revisada el 21 de octubre de 2026. Fuentes del operador o del proveedor que administra el contrato. Los años corresponden al dato publicado, no a una estimación de la flota actual.

## Qué puede afirmarse

No se encontró un censo público, reciente y homogéneo que permita afirmar un **promedio nacional de palas o camiones por mina**. Las fuentes mezclan flota instalada, equipos bajo un contrato, subconjuntos autónomos y proyectos futuros. Por eso se presentan referencias por faena y fecha. La cantidad de equipos instalados tampoco equivale a equipos disponibles o simultáneamente operando.

Para comparar, “pala” incluye pala eléctrica de cable e hidráulica; excluye cargadores frontales, rotopalas, perforadoras y equipos auxiliares. El cociente camiones/pala es una descripción del conjunto publicado, no una regla para dimensionar una operación: depende del ciclo, distancias, desnivel, carga útil, pases y disponibilidad.

## Muestra documentada

| Faena / período | Camiones publicados | Palas publicadas | Camiones / pala | Alcance y cautela |
|---|---:|---:|---:|---|
| Spence, noviembre 2024 | 33 | 6: 5 eléctricas + 1 hidráulica | 5,50 | Flota de transporte totalmente autónoma; un rajo; dos chancadores. |
| Escondida, noviembre 2024 | 188 | 18 eléctricas | 10,44 | Dos rajos; 15 autónomos en Norte son subconjunto, no flota total. El discurso redondea camiones a “alrededor de 190”. |
| Los Pelambres, diciembre 2016 | 52 | 5 eléctricas | 10,40 | Referencia histórica; además 2 cargadores frontales, excluidos del denominador. |
| Ministro Hales, junio 2021 | 39 ultraclass | 6 | 6,50 | Equipos cubiertos por extensión de soporte Finning; no confirma que sea toda la flota de la división. |
| Gabriela Mistral, abril–mayo 2021 | 18 autónomos | 3: 2 eléctricas + 1 hidráulica | 6,00 referencial | Dos documentos del mismo año: CAEX con sensores de combustible y palas incluidas en monitoreo estructural. El segundo no declara censo integral. |
| Centinela, diciembre 2016 / enero 2023 | 74 en 2016; 11 autónomos Esperanza Sur en 2023 | No hay desglose comparable | No calculado | En 2016 se agrupan 16 equipos de carguío: palas, cargadores y otros; no corresponde llamarlos 16 palas. Los 11 autónomos son de un rajo. |
| Quebrada Blanca, AIF 2024 | Sin conteo en la fuente citada | Sin conteo en la fuente citada | No calculado | Se confirma transporte 100% autónomo; no se convierten planes antiguos de QB2 en inventario actual. |

No se calcula una mediana nacional a partir de esta selección. Sólo Spence y Escondida son dos instantáneas contemporáneas de inventario del mismo operador, y aun ellas tienen distinto número de rajos y distinta mezcla de palas. Las restantes referencias tienen fechas o alcances diferentes.

## Fuentes y lectura para el simulador

### Spence — referencia autónoma de escala intermedia

[BHP, visita a Spence, 20 de noviembre de 2024, diapositiva 12](https://www.bhp.com/-/media/documents/media/reports-and-presentations/2024/241120_chileansitetour_spencepresentationandspeech.pdf).

Publica 33 Komatsu 980E de clase 400 t autónomos, cinco palas eléctricas y una hidráulica; dos chancadores primarios sirven las rutas de concentrado y cátodos. La conversión de los 33 camiones se completó en abril de 2024. Es una referencia concreta para ampliar el MVP a seis palas. También justifica destinos diferenciados para material y zonas de seguridad en torno a equipos autónomos. El dato representa noviembre de 2024; no prueba la composición exacta de 2026. No sustituir “400 t” de la presentación por una ficha técnica del modelo sin comprobar versión y unidades.

### Escondida — varios rajos y efecto del acceso

[BHP, visita a Escondida, 19 de noviembre de 2024, diapositivas 13, 15–17](https://www.bhp.com/-/media/documents/media/reports-and-presentations/2024/241120_chileancoppersitetour_day2presentationsandspeeches.pdf).

La diapositiva 15 lista 188 camiones y 18 palas eléctricas entre Escondida y Escondida Norte; el discurso redondea a unos 190. Los 15 autónomos en Norte son un subconjunto. La mina más profunda alarga los ciclos. En agosto de 2024, una inestabilidad obligó a cerrar dos de cuatro rampas de acceso y se mitigó usando rutas alternativas y camiones adicionales. Para el modelo esto respalda una red con accesos redundantes y cierres que cambian rutas y capacidad; añadir flota no elimina automáticamente el cuello de botella vial. Es una referencia de gran escala, no de una mina típica.

### Los Pelambres — transporte y carguío separados

[Antofagasta plc, visita a Los Pelambres, 5 de diciembre de 2016, diapositiva 16](https://www.antofagasta.co.uk/media/3142/mlp-site-visit-presentation-dec-5-2016.pdf).

El esquema de proceso presenta 52 camiones Komatsu 930E, cinco palas eléctricas, dos cargadores frontales y dos chancadores giratorios. El cociente 52/5 considera sólo palas; 52/7 sería camiones por unidad de carguío contando también cargadores y sería otra métrica. La fuente sirve como configuración histórica de referencia y para distinguir frentes de mina, botadero, stock y chancado. No usarla como flota actual. Permite un escenario sintético de aproximadamente cinco o seis palas y 50 camiones, siempre etiquetado como inspirado en una referencia histórica y no como gemelo de Los Pelambres.

### Ministro Hales — evitar confundir contrato con inventario total

[Finning, Investor Day, 14 de junio de 2021, diapositiva 42](https://www.finning.com/content/dam/finning/Global/Documents/events-presentations/2021/Finning%20Investor%20Day_June%2014%2C%202021.pdf).

Reporta una extensión de cinco años del soporte a 39 camiones ultraclass y seis palas en Ministro Hales, además de un piloto de autonomía. Es evidencia primaria del proveedor sobre su contrato, no un censo integral ni confirmación de 39 autónomos. La misma diapositiva distingue la reposición de 22 camiones en Radomiro Tomic y el proyecto QB2: esos números no deben sumarse a Ministro Hales. Un preset sintético con seis palas y unos 40 camiones es razonable como caso de estudio del tamaño del contrato, manteniendo separado el porcentaje autónomo.

### Gabriela Mistral — referencia pequeña totalmente autónoma

[Codelco, gestión de combustible de CAEX, 31 de mayo de 2021](https://www.codelco.com/operaciones/el-equipo-de-la-superintendencia-de-ingenieria-y-gestion-mina-de).

Confirma sensores de combustible y dashboard en 18 camiones autónomos; el abastecimiento pasó de alertarse al 35% a hacerlo al 20% como parte del nuevo estándar de esa operación. Es evidencia para modelar decisiones de combustible, cola de petrolera y telemetría, sin adoptar esos umbrales como regla universal. La [nota de Codelco del 16 de octubre de 2019](https://www.codelco.com/camiones-autonomos-cumplen-11-anos-contribuyendo-a-una-mineria-mas) precisa que los 18 autónomos constituían la flota total en esa fecha. Para palas, la [licitación WS189631450 de abril de 2021, página 2](https://www.codelco.com/prontus_codelco/site/docs/20210414/20210414111827/resumen_ejecutivo___so_monitoreo_estructural_eq_critico_v2.pdf) incluye tres: dos eléctricas y una hidráulica. Es alcance de monitoreo, no declaración de inventario completo.

### Centinela — distrito, no circuito único

[Antofagasta plc, visita a Centinela, 7 de diciembre de 2016](https://www.antofagasta.co.uk/media/3145/centinela-site-visit-presentation-dec-5-2016.pdf).

La presentación enumera 74 camiones y 16 equipos de carguío de varias clases; no permite un conteo aislado de palas. Da dimensiones históricas de rajos: Esperanza, 1,5 × 1,3 km y 416 m de profundidad; Tesoro Central, 1,9 × 1,7 km y 300 m; Mirador, 1,2 × 0,6 km y 208 m. No equivalen a rutas transitables ni geometría actual. La [presentación de noviembre de 2025, diapositiva 8](https://www.antofagasta.co.uk/media/4867/20251106_anto-site-visit-2025-centinela-presentation-nov2025-vf.pdf) describe cuatro rajos y 40% del movimiento autónomo. Una [nota oficial de enero de 2023](https://prod.antofagasta.co.uk/media/articles/centinela-inaugurates-autonomous-systems-in-the-esperanza-sur-pit/) identifica 11 camiones autónomos en Esperanza Sur desde octubre de 2021; la aspiración de crecer a 100 no es inventario observado.

### Quebrada Blanca — autonomía confirmada, cifras de proyecto aparte

[Teck, AIF 2024 presentado a la SEC, apartado Quebrada Blanca](https://www.sec.gov/Archives/edgar/data/886986/000088698625000004/teck-20241231xexx991aif.htm).

Describe la operación actual de sulfuros, iniciada en 2023, como rajo con transporte 100% autónomo. Confirma un chancador primario y transporte posterior por correa al stock. No publica allí un conteo de camiones y palas, por lo que no se asigna uno. La [página oficial de la operación](https://www.teck.com/operations/chile/operations/quebrada-blanca/) sitúa la faena a 4.400 m y describe un centro integrado remoto en Santiago. Sirve para modelar un único acceso a chancado, altura y supervisión remota. Los planes de QB2 de 2019 no deben presentarse como flota vigente: fueron un proyecto y sus estimaciones cambiaron.

## Presets propuestos para el MVP

Los números siguientes son **escenarios sintéticos**, salvo las cantidades explícitas de referencia; no reproducen rutas, producción ni condiciones reales de las faenas.

| Preset | Palas | Camiones | Uso |
|---|---:|---:|---|
| Compacto autónomo | 3 | 18 | Inspirado en los documentos de Gabriela Mistral de 2021. Útil para aprender colas y disponibilidad. |
| Rajo autónomo intermedio | 6 | 33 | Tamaño publicado de Spence en noviembre de 2024. Geometría y rendimiento permanecen sintéticos. |
| Rajo profundo | 6 | 54 | Sintético; recorridos largos y rampas restringidas para observar dónde agregar camiones deja de ayudar. |
| Distrito con dos rajos | 10 | 90 | Sintético; muestra competencia entre frentes por chancado y cruces de rutas. |
| Gran escala | 18 | 188 | Tamaño publicado de Escondida en noviembre de 2024 entre dos rajos; dividir frentes y flota entre rajos, sin asignar todo a un solo circuito. |

Recomendación de interfaz: mínimo 1 y máximo 20 palas, 12–200 camiones; predeterminado seis palas y 48 camiones, rotulado como sintético. Separar equipos instalados, disponibles y activos. No fijar camiones/pala como objetivo: calcular saturación usando tiempo de ciclo y tiempo de servicio de carguío, y dejar que el optimizador pruebe asignaciones sujetas a restricciones de vía y destino. Representar la autonomía como atributo/equipamiento del vehículo y su sistema de control, no como sinónimo de GPS.

La arquitectura visual debe contener bancos, rampas con cota, frentes, intersecciones, apartaderos, botaderos, stocks, chancado y zona de servicios. Cada tramo necesita dirección permitida, ancho, pendiente, velocidad, capacidad y cierre. Una inestabilidad, una tronadura o la pérdida de comunicación debe afectar los tramos y recursos pertinentes; sus probabilidades iniciales seguirán siendo supuestos editables hasta calibrarlas con datos de operación.
