# Catálogo de equipos para el MVP pala–camión

Investigación de fichas oficiales de fabricantes, consultadas el 21 de octubre de 2026. Todas las toneladas de esta tabla son **métricas**. Son perfiles de catálogo; una unidad instalada puede tener distinta tolva, motor, neumáticos o configuración de autonomía.

## Camiones

| Modelo y variante | Carga útil t | Potencia bruta / neta kW | Peso bruto t | Ancho de referencia m | Máximo de catálogo km/h | Tracción |
|---|---:|---:|---:|---|---:|---|
| Komatsu 930E-5 | 290 | 2.014 / 1.930 | 521,640 | 9,15 rotulado; esquema frontal 9,60 | 64,5 | Diésel eléctrica AC |
| Komatsu 980E-5 | 363 | 2.610 / 2.495 | 627,999 | 10,01, con tolva estándar | 64,5 | Diésel eléctrica AC |
| Cat 793 (04), 3516E | 232 | 1.801 / 1.694 | 383,739 | Visera 8,600; operativo rotulado 7,680 | 54,3 cargado | Mecánica, 6 marchas |
| Cat 797F | 363 | 2.983 / 2.828 | 623,690 | Neumáticos 9,529; tolva 9,755 | 63,6 cargado | Mecánica, 7 marchas |
| Liebherr T 284, MTU C22 | 363 | 2.720 / no publicada | 605,000 | 9,679, dependiente de tolva | 64,0 | Diésel eléctrica AC |

**930E-5.** Se conserva el peso nominal bruto de la sección técnica: 521.640 kg; el encabezado web muestra 521.631 kg. La dimensión frontal de 9,60 m es una envolvente conservadora para la ilustración, distinta del rótulo de ancho total 9,15 m. La integración FrontRunner AHS está documentada para este modelo y requiere configuración; no viene implícita en cada unidad. Fuentes: [ficha Komatsu](https://www.komatsu.com/en-us/products/equipment/trucks/electric-drive-mining-trucks/930e-5), [dimensiones, p. 17](https://www.komatsu.com/content/dam/komatsu/sales-and-marketing-documents/brochures/trucks/930e/930e-5-aess921-01-ev1.pdf), [AHS en 930E-5](https://www.komatsu.eu/de/news/komatsu-europe-stattet-muldenkipper-von-boliden-mit-dem-autonomen-transportsystem-frontrunner-aus).

**980E-5.** La página vigente publica máximo 64,5 km/h; el catálogo latinoamericano redondea a 64. El ancho 10,01 m corresponde a camión vacío con tolva estándar. Komatsu identifica la variante autónoma **980E-5AT**: no debe suponerse AHS instalado en cualquier 980E-5. Fuentes: [ficha Komatsu](https://www.komatsu.com/en-us/products/equipment/trucks/electric-drive-mining-trucks/980e-5), [catálogo OEM Perú, p. 14](https://www.komatsu.pe/images/komatsu/mineria/camiones-electricos/980E-5.pdf), [comunicado OEM que identifica 980E-5AT](https://www.komatsu.jp/ja/newsroom/2024/20240314).

**Cat 793 (04).** Perfil con motor 3516E y carga útil de 232 t. El ancho de visera de 8,600 m se usa como envolvente conservadora para las restricciones ilustrativas; la ficha también rotula ancho operativo 7,680 m y neumáticos 7,600 m. Largo 13,640 m y velocidad máxima cargado 54,3 km/h. La ficha confirma soluciones MineStar generales; no se confirmó AHS para esta variante exacta. Cualquier autonomía modelada en el MVP es un supuesto separado. [Ficha oficial Cat 793 (04)](https://www.cat.com/en_GB/products/new/equipment/off-highway-trucks/mining-trucks/130980.html).

**Cat 797F.** La tabla técnica publica 63,6 km/h cargado. El texto comercial de esa misma página contiene una conversión inconsistente de 60 km/h con 42 mph; se conserva el dato de la tabla y se explicita la discrepancia. La tolva tiene más ancho que los neumáticos, por lo que 9,755 m sirve mejor como envolvente ilustrativa. Cat lo declara preparado de fábrica para Command. [Ficha oficial Cat 797F](https://www.cat.com/en_US/products/new/equipment/off-highway-trucks/mining-trucks/18093014.html).

**T 284.** La base consultada usa MTU 20V4000 C22, 2.720 kW brutos. Se ofrecen otros motores de 2.700 y 3.000 kW. La página actual indica 64 km/h; la guía 2024 indica 57,3 km/h, de modo que se debe confirmar la configuración instalada. La página ofrece AHS y documenta Trolley Assist en Collahuasi, Chile. Un pantógrafo y la telemetría GPS no acreditan autonomía. Fuentes: [ficha Liebherr T 284](https://www.liebherr.com/en-ie/mining-equipment/equipment/mining-trucks/t284-8361094), [guía OEM 2024, pp. 306–307](https://www-assets.liebherr.com/media/global/access/access/corporate/mining/application-guide/mining_application_guide_2024.pdf).

### Variante Cat adicional, fuera de los cinco perfiles base

El **793 actual, motor C175-16**, ofrece 240 t, 1.976 kW brutos SAE J1995:2014, 1.886 kW netos SAE J1349:2011, peso bruto 404 t y máximo cargado 60 km/h. Cat publica integración de MineStar Command. No se verificaron dimensiones de esa variante: **no se le atribuyen las dimensiones del 793 (04)**. [Ficha oficial Cat 793](https://www.cat.com/en_US/products/new/equipment/off-highway-trucks/mining-trucks/116620.html).

## Equipos de carguío y pasadas

| Equipo | Tipo | Capacidad documentada | Consideración |
|---|---|---|---|
| P&H 4100XPC | Pala eléctrica de cables | Carga nominal 99,8–108,9 t; balde 52,8–61,2 m³ SAE struck | Komatsu indica camiones óptimos de 218–363 t; depende de aplicación |
| Cat 7495 con Rope Crowd | Pala eléctrica de cables | Hasta 109 t métricas; balde 30,6–62,7 m³ | Cat referencia su geometría con 797F y balde de 56 m³ |
| Liebherr R 9800 G6 frontal | Pala hidráulica frontal | 42 m³ a 1,8 t/m³; carga aproximada 75,6 t | Distinguir de configuración retro: 47,5 m³ y aproximadamente 85 t |

Fuentes: [Komatsu P&H 4100XPC](https://www.komatsu.com/en-us/products/equipment/electric-rope-shovels/4100xpc), [Cat 7495 Rope Crowd](https://www.cat.com/en_US/products/new/equipment/electric-rope-shovels/electric-rope-shovels/18416406.html), [Liebherr R 9800 G6](https://www.liebherr.com/en-us/p/r9800-4707130), [catálogo oficial de baldes Liebherr](https://assets-cdn.liebherr.com/assets/api/3023ed1d-02bb-4871-8e85-e260f3f20d05/Original/).

No se debe copiar el perfil de la **4100XPC AC-90** a la 4100XPC de esta tabla; existe una ficha distinta con menor carga nominal. Tampoco debe leerse la interfaz bilingüe de Cat como 120 toneladas métricas: son 120 toneladas estadounidenses, equivalentes a 109 t métricas.

### Cálculo ilustrativo para el simulador

La carga efectiva por pasada debe modelarse como el mínimo entre el límite configurado del equipo y `volumen × densidad suelta × llenado`. Las pasadas son el techo de `carga objetivo / carga efectiva`; la última descarga debe ajustarse para evitar sobrecarga.

Ejemplo **asumido, editable y no prometido por el fabricante**: densidad suelta 1,8 t/m³ y llenado 90 %. Un balde de 56 m³ mueve 90,72 t por pasada; uno frontal de 42 m³ mueve 68,04 t.

| Carga del camión | Pala de cables de 56 m³ | R 9800 frontal de 42 m³ |
|---|---:|---:|
| 240 t | 3 pasadas | 4 pasadas |
| 290 t | 4 pasadas | 5 pasadas |
| 363 t | 5 pasadas | 6 pasadas |

El resultado de 5 pasadas para 363 t con 90,72 t por pasada es correcto: cuatro suman 362,88 t; la quinta sería parcial. Una densidad o llenado algo mayor cambia el número. Esto demuestra por qué la compatibilidad no debe fijarse solo por modelo.

## Uso correcto de las fichas en la simulación

La velocidad máxima del catálogo es un techo del equipo. La velocidad efectiva debe depender de pendiente, carga, resistencia a la rodadura, curvatura, clima, separación y límites del tramo. Para calibrarla se necesitan curvas de tracción/frenado o telemetría de la faena; la potencia bruta por sí sola no basta.

Tiempos de carguío y posicionamiento, MTBF, reparación, consumo, pérdida GPS, llenado, densidad y reducciones por altura deben figurar como **supuestos de simulación** hasta tener datos de la faena. Este catálogo no inventa esos valores ni permite concluir una mejora real de producción por instalar AHS.
