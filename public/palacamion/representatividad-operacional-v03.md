# Representatividad operacional del MVP pala–camión

Revisión de fuentes primarias: 21 de octubre de 2026. Estas referencias respaldan mecanismos y datos que conviene modelar; no calibran una faena particular. La autonomía elimina ciertas tareas de conducción, pero no elimina combustible, mantenimiento, congestión, indisponibilidad ni restricciones del plan.

## Cinco fuentes y su aplicación

### 1. Combustible y colas: caso Sierra Gorda de Wenco

[Increasing Productivity and Conserving Person-Hours Through Automated Fuel Dispatching at Sierra Gorda](https://www.wencomine.com/case-studies-and-white-papers/increasing-productivity-and-conserving-person-hours-through-automated-fuel-dispatching-at-sierra-gorda).

Wenco describe despacho de combustible para 58 Komatsu 930E de Sierra Gorda. Publica mayor volumen por sesión, un consumo de 260 L/h en ese caso y menor espera en estaciones. Sustenta representar desvío, espera y servicio como pérdidas distintas, además de escalonar los repostajes. El consumo y los resultados del caso no son un promedio de Chile ni una especificación aplicable a todo 930E. La página no permite inferir un umbral universal de repostaje ni un caudal de surtidor.

### 2. Condición y mantenimiento: Komatsu Komtrax Plus

[Komtrax Plus](https://www.komatsu.com/en-ae/services/komtrax/komtrax-plus).

Komatsu documenta monitoreo de condición de componentes, horómetro, fallas, consumo, carga y tiempo de operación frente a ralentí. Incluye camiones y excavadoras mineras. Sustenta separar el reloj de exposición mecánica del reloj de turno, registrar estados y considerar mantenimiento tanto de camiones como de palas. No publica aquí MTBF, MTTR ni disponibilidad universales; deben estimarse por equipo y faena. La existencia de telemetría tampoco demuestra que un camión sea autónomo ni garantiza acceso a sus datos.

### 3. Programa por equipo: Caterpillar

[Planned Maintenance Schedules](https://www.cat.com/en_US/support/maintenance/planned-maintenance.html.html).

Caterpillar organiza sus listas de mantenimiento por prefijo de número de serie y por intervalo apropiado. Sustenta que el mantenimiento programado sea configurable por unidad/modelo, horas acumuladas, vencimiento y duración, en vez de aplicar una detención genérica a toda la flota. Esta página no entrega un intervalo ni duración universales. Los valores efectivos deben provenir del manual y configuración de la unidad y de órdenes de trabajo. No puede deducirse disponibilidad mecánica a partir del intervalo de servicio.

### 4. Chancado y tolva: Metso Superior MKIII / SmartStation

[Mining crushers — Superior MKIII Primary Gyratory, folleto 4435-02-22-EN-MNG](https://www.metso.com/globalassets/product-pages/crushers/stationary-crushers/primary-gyratory-crushers/brochure-superior-crusher-4435-02-22-en-mng.pdf), páginas 6–7.

Metso describe sensores de equipos y bin/hopper, análisis de alimentación y control automático del chancado; muestra sensor de nivel de bóveda. Sustenta distinguir descarga discreta del camión, inventario intermedio y procesamiento continuo. Así aparecen bloqueo por tolva llena y hambre por tolva vacía. El folleto no determina el volumen de una tolva específica ni el tiempo de descarga. Las capacidades de catálogo tampoco equivalen a capacidad sostenida de planta: dependen de alimentación, ajustes y condiciones declaradas.

### 5. Despacho sujeto al plan: Wenco

[Mining Fleet — Dynamic Dispatch](https://www.wencomine.com/our-solutions/dispatching).

Wenco describe asignaciones según puntos de carga y descarga, datos del plan minero, calidad de mineral, mezcla, combustible y pausas. Sustenta evaluar cumplimiento de mineral, estéril y mezcla antes de premiar más toneladas. El objetivo es una decisión del plan, no una propiedad del camión. Las mejoras promocionales del proveedor no son resultados esperables del MVP ni tasas para parametrizarlo. La fuente no proporciona una ley objetivo, razón estéril/mineral ni cuotas transferibles a minas chilenas.

## Cuatro mejoras concretas y datos mínimos para validarlas

| Mejora | Comportamiento representado | Parámetros que siguen siendo supuestos calibrables | Datos mínimos y comprobación |
|---|---|---|---|
| Repostaje como recurso con cola | Cada camión consume según estado; antes de aceptar un ciclo revisa combustible para ruta y reserva. Vacío se desvía al servicentro, espera, reposta y vuelve a despacho. Estaciones tienen puestos y acceso vial. | Capacidad de tanque por configuración, nivel inicial, consumo cargado/vacío/ralentí, reserva, caudal, conexión y puestos. No fijar el umbral como recomendación operacional. | Registros de nivel/consumo y litros abastecidos con fecha, unidad, entrada/fin de cola y servicio; ubicación y capacidad de estaciones. Comparar litros por turno, sesiones y distribución de espera. |
| Mantenimiento y fallas de palas y camiones | Programación individual por horómetro, falla no programada y reparación con capacidad de taller; la pala detenida suspende carguíos y provoca reasignación. | Horas previas al inicio, ventanas e intervalos, duraciones y exposición que acumula riesgo. Distribuciones de fallas/reparación ajustables; exponencial es una simplificación, no un hecho. | Historial de estados y órdenes con equipo, inicio/fin, causa y horas de operación. Reproducir disponibilidad mecánica y utilización por separado, eventos y cola de taller. |
| Tolva finita y planta separada | Descarga incorpora carga al inventario; el chancador procesa t/h mientras está disponible. El camión espera cuando no cabe su carga. Se registran hambre, bloqueo y mineral procesado además de descargado. | Capacidad útil, nivel inicial, umbrales de admisión, tiempo de maniobra/descarga, t/h efectivo, paradas y reglas de desvío. | Series temporales de nivel y alimentación, tonelaje y hora de cada descarga, estados del chancador y capacidad de diseño/operacional. Verificar balance: inicial + recibido − procesado = inventario. |
| Despacho y selección por cumplimiento del plan | Cuotas por mineral/estéril y, si hay datos, por frente/ley. Considerar carga en tránsito al calcular déficit para no sobreasignar. Comparar cumplimiento robusto y luego producción/costo; mostrar desvíos. | Cuotas de turno, tolerancias, leyes, prioridades, material disponible y ponderación de incumplimientos. El plan no se infiere de la flota ni de una razón nacional. | Plan aprobado por turno/frente/destino, despacho real y cargas con masa/material/ley. Comparar déficit, excedente, mezcla y restricciones incumplidas en turnos nuevos. |

## Criterios para no sobreinterpretar resultados

- Un escenario sintético puede verificar causalidad y conservación de recursos; no permite predecir producción, ahorro ni desempeño AHS de una faena sin calibración.
- Las referencias de Sierra Gorda documentan un caso de combustible; sus cantidades, consumos y mejoras no se trasladan como promedio chileno ni se usan como promesa.
- Disponibilidad mecánica debe contar mantenimiento/fallas contra un tiempo definido explícitamente. Espera, GPS, ausencia de ruta y falta de asignación se informan aparte, para no confundir confiabilidad con utilización.
- La capacidad nominal de chancado no implica capacidad de tolva ni plazo de descarga. Mineral descargado, procesado y en tránsito deben quedar separados.
- Un candidato con más material total puede incumplir el plan. La evaluación debe conservar probabilidades de falla y externalidades, usar réplicas y mostrar distribución de cumplimiento fuera de muestra.
- Las reglas de reserva, acceso, tránsito y despacho del prototipo son controles de simulación; deben reemplazarse por procedimientos aprobados antes de cualquier aplicación operacional.
