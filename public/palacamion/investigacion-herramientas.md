# Herramientas para simular y optimizar una operación pala–camión

Investigación revisada el **21 de octubre de 2026**. Se asume una operación de minería a cielo abierto con camiones autónomos. Las capacidades comerciales descritas proceden de fuentes oficiales; su encaje y la arquitectura propuesta son una evaluación para este proyecto.

## Recomendación

**Para comprar una solución minera:** poner HAULSIM primero en una prueba con datos de la faena y AnyLogic como alternativa cuando pesen más las reglas propias de despacho, la integración y la flexibilidad. La prueba debe medir ajuste a ciclos reales, congestión, resultados estocásticos e integración disponible, además de calidad visual.

**Para desarrollar un producto propio:** usar un motor de eventos discretos, visualización web 3D y un optimizador separado. SimPy + Three.js + OR-Tools es una base razonable; OpenMines ofrece una referencia minera que conviene evaluar antes de reutilizar. Ninguna biblioteca constituye, por sí sola, el sistema completo solicitado. El MVP entregado es una demostración con datos sintéticos y reglas explícitas; una implementación productiva requiere calibración con datos de la faena.

## Comparación de alternativas

| Herramienta | Encaje y movimiento 3D | Restricciones, incertidumbre y optimización | GPS/AHS e integración: evidencia y trabajo pendiente | Licencia y límites relevantes |
|---|---|---|---|---|
| **HAULSIM — RPMGlobal** | Especializada en carguío y transporte minero; DES e interfaz 3D de la red de acarreo. Adecuada para visualizar circulación, colas y congestión. | La página oficial contempla reglas viales, velocidades, asignación camión/cargador, mantenimiento, flota y destinos. Sirve para probar escenarios; hay que demostrar en la oferta el alcance exacto del optimizador automático y sus objetivos. | El folleto menciona calibrar velocidades con datos GPS. No se encontró evidencia pública suficiente de un conector universal GPS/AHS en vivo. Exigir demostración con el FMS/OEM concreto. | Comercial. No se verificó una tarifa pública comparable. Solicitar cotización de licencia, implantación, capacitación y soporte. [Producto](https://rpmglobal.com/product/haulsim/), [folleto oficial](https://rpmglobal.com/wp-content/uploads/2021/12/haulsim_brochure.pdf). |
| **AnyLogic** | Plataforma flexible; caso oficial de Modular Mining/Komatsu con red minera, palas, camiones y visualización. La presentación incluye caminos 3D. | El caso incorpora turnos, mantenimiento, MTBF, despacho e intersecciones. Los experimentos de optimización admiten variables, restricciones y requisitos, con motores Genetic u OptQuest. Las reglas particulares deben modelarse. | El caso demostrado importa archivos y reproduce eventos de un simulador interno. La plataforma ofrece APIs e integración; conectar GPS/AHS de la faena sigue siendo un proyecto específico. | Comercial para uso empresarial. PLE es para evaluación/uso personal, limita tamaño y ejecución animada; no asumir licencia comercial gratuita. [Caso](https://www.anylogic.com/resources/case-studies/load-and-haul-optimization-in-a-generic-mining-simulation-model/), [3D y datos](https://www.anylogic.com/upload/pdf/alc-2022/komatsu-modular-mining-presentation.pdf), [optimización](https://anylogic.help/anylogic/experiments/optimization.html), [licencias](https://www.anylogic.com/downloads/). |
| **FlexSim** | Simulación general con 3D; antecedente oficial de su aplicación de acarreo integrada en HAULSIM. Conveniente si ya existe experiencia interna en FlexSim. | Experimenter compara escenarios con réplicas y Optimizer busca combinaciones de parámetros. La documentación consultada indica licencia adicional OptQuest; confirmar condiciones en la edición contratada. Reglas mineras y malas prácticas requieren configuración/modelamiento. | El antecedente minero no demuestra un enlace GPS/AHS disponible hoy. Pedir prueba del flujo de datos, API y frecuencia de actualización del caso de uso. | Comercial. Express tiene límites y la documentación prohíbe emplearlo para decisiones empresariales; tampoco habilita Experimenter/Optimizer. [Antecedente minero](https://www.flexsim.com/news/flexsim-partners-with-mining-giant-rpm-for-truck-haulage-simulation/), [experimentos](https://docs.flexsim.com/en/21.0/Reference/Tools/ExperimenterOptimizer/ExperimenterOptimizer.html), [límites oficiales](https://docs.flexsim.com/en/25.1/Introduction/ActivatingManagingLicense/ActivatingManagingLicense.html). |
| **Simio** | DES con animación 3D, tableros dinámicos, reproducción y conectividad de datos. Es una plataforma general; requiere construir el modelo minero. | Experimentos, comparación de escenarios y optimización con OptQuest documentados. Restricciones de recursos, materiales y lógica se representan en el modelo. | Documenta APIs e integración con bases de datos y sistemas operacionales. Esto demuestra capacidad de plataforma, no un conector AHS minero listo para usar. | Comercial; ventas entrega orientación de precio según requerimientos. Confirmar edición, módulos y despliegue. [DES y visualización](https://www.simio.com/discrete-event-simulation), [optimización](https://www.simio.com/whitepapers/simio-intelligent-adaptive-process-digital-twin-optimization-and-experimentation), [integración](https://www.simio.com/whitepapers/digital-twin-it-architecture-and-integration), [ventas](https://www.simio.com/contact). |
| **OpenMines** | Simulador Python especializado en despacho de camiones. El repositorio documenta visualización/exportación GIF; no demuestra un motor 3D equivalente a las opciones comerciales. | Configuración JSON, algoritmos de despacho extensibles y eventos probabilísticos definidos por el usuario. Buen punto de partida para investigación y comparación de políticas. | No se verificó una integración GPS/AHS productiva en el repositorio. Adaptadores, seguridad operacional, escalabilidad y operación continua quedarían por desarrollar. | MIT. Que el código no tenga costo de licencia no elimina el costo de adaptación, pruebas y mantenimiento. [Repositorio y licencia](https://github.com/370025263/openmines), [artículo de los autores](https://arxiv.org/abs/2404.00622). |
| **SimPy + Three.js + OR-Tools** | Desarrollo propio: SimPy aporta eventos/colas; Three.js, escena 3D animada en navegador. El vínculo entre estado de simulación y camiones debe implementarse. | SimPy representa recursos limitados e interrupciones; OR-Tools aborda asignaciones y restricciones. Distribuciones, fallas, clima y búsqueda robusta deben diseñarse y calibrarse. | Integración completamente propia. Permite controlar el contrato de datos y el dashboard, a cambio de más ingeniería y responsabilidad de mantenimiento. | SimPy y Three.js: MIT; OR-Tools: Apache 2.0. Sin tarifa de licencia para esos componentes; sí hay costos de producto, infraestructura y soporte. [SimPy](https://simpy.readthedocs.io/en/latest/index.html), [recursos](https://simpy.readthedocs.io/en/stable/topical_guides/resources.html), [Three.js](https://threejs.org/manual/pages/fundamentals.html), [licencia 3D](https://threejs.org/license/), [OR-Tools](https://developers.google.com/optimization), [licencia](https://github.com/google/or-tools/blob/stable/LICENSE). |

Los precios no se estiman porque las fuentes revisadas no permiten comparar paquetes equivalentes y vigentes. Tampoco se interpreta el término comercial “digital twin” como prueba de sincronización en vivo con una faena específica. Parte de la documentación enlazada es de versiones anteriores; sirve como evidencia de capacidad, y sus condiciones deben reconfirmarse en una adquisición.

## Modelo mínimo que debe existir detrás de la animación

La escena 3D debe mostrar resultados del motor de simulación. Mover vehículos de manera visual, sin representar recursos, colas y tiempos, no permite estimar productividad.

**Ciclo:** asignación → viaje vacío → cola y posicionamiento en pala → carga → viaje cargado → cola y descarga → retorno. Separar esperas, mantenimiento y recuperación de fallas. Las toneladas cuentan cuando la descarga concluye, y cada camión conserva su material y carga durante el ciclo.

**Restricciones:** compatibilidad pala–camión; carga útil; capacidad de cada frente y destino; material permitido; disponibilidad de equipos; caminos habilitados, velocidades, sentido y cupos; separación y prioridad en intersecciones; ventanas de tronadura y mantenimiento. Para equipos eléctricos, incorporar batería y cargadores solo cuando existan curvas y datos de consumo adecuados.

**Variabilidad:** tiempos de carga/descarga, carga útil, velocidades, falla y reparación, mala posición para cargar, detención innecesaria, saturación del destino, lluvia y cierres. Una “mala práctica” debe definirse con un evento observable, su probabilidad y su impacto. Para flota autónoma conviene modelar también pérdida de comunicaciones, degradación de localización y recuperación. Clima y cierres pueden afectar simultáneamente a varios vehículos; tratarlos como eventos independientes subestima el riesgo.

**Gestión:** toneladas y t/h; cumplimiento de meta; ciclo medio y percentiles; colas por pala/destino; estados y carga por camión; tiempo productivo, espera y falla con denominadores visibles; utilización de palas; saturación de vías y capacidad perdida. Un cuello de botella se debe respaldar con colas, utilización y efecto de liberar capacidad, no solo con una luz roja.

Estas son recomendaciones de diseño para este caso, no funciones que se atribuyan a todos los productos de la tabla.

## Optimizar bajo incertidumbre

Separar tres capas: **factibilidad**, que rechaza políticas que incumplen restricciones; **búsqueda**, que propone flota/asignaciones/reglas; y **evaluación estocástica**, que ejecuta varias réplicas por propuesta. Un objetivo útil es maximizar producción esperada o minimizar costo por tonelada sujeto a límites de espera, capacidad y riesgo de incumplir la meta. La operación decide los pesos y umbrales; un simulador no puede inferirlos de forma fiable.

Comparar base y candidato con las mismas semillas de evaluación, y reservar semillas nuevas para validar al ganador. Informar promedio, dispersión, percentiles y probabilidad de cumplir la meta. Nunca elegir una política porque produjo el mejor resultado de una única ejecución afortunada. Aumentar réplicas cuando la incertidumbre impida distinguir alternativas.

**“Mejor candidato encontrado” es la expresión correcta para una búsqueda limitada.** Incluso si CP-SAT devuelve `OPTIMAL`, la garantía se refiere al problema matemático formalizado, bajo sus supuestos; no demuestra el óptimo global de la mina física ni de todas sus externalidades. OR-Tools distingue explícitamente `OPTIMAL`, `FEASIBLE` y otros estados. [Estados oficiales de CP-SAT](https://developers.google.com/optimization/cp/cp_solver).

## Evolución hacia GPS y flota autónoma

Arquitectura propuesta: **FMS/AHS/OEM → adaptador autorizado → normalización/calidad → registro de eventos e histórico → estimador del estado actual → simulador → búsqueda de políticas → dashboard y revisión operacional**. La visualización consume el mismo estado de eventos que los indicadores. El optimizador debe poder ejecutarse sin renderizar 3D para procesar más escenarios.

Primero reproducir un turno histórico y calibrar. Después operar en modo sombra con telemetría de solo lectura y comparar predicción con resultado. Una etapa posterior puede emitir recomendaciones de asignación al despacho. El control de conducción, frenado y seguridad corresponde al sistema AHS y su proceso de validación; una recomendación de producción no debe convertirse automáticamente en una orden de movimiento.

Contrato mínimo por mensaje: identificador estable de equipo, hora UTC del evento y de recepción, posición y sistema de coordenadas, calidad/precisión, velocidad, rumbo, estado operacional, carga útil, origen/destino/material y eventos de falla. Detectar datos atrasados, duplicados, fuera de secuencia y pérdida de señal. Un punto GPS aislado no permite distinguir de manera fiable carga, cola, avería o mantenimiento; se necesitan eventos y estados del FMS/AHS.

## Datos mínimos para calibrar

| Conjunto | Contenido mínimo |
|---|---|
| Red | Nodos y trayectorias con coordenadas, longitudes, pendientes, sentidos, velocidades, restricciones, cruces y cierres. |
| Equipos | Identificador/modelo, carga útil, disponibilidad, tiempos/curvas de viaje cargado y vacío, compatibilidad, mantenimiento. |
| Palas y destinos | Posición, material, capacidad, tiempo de servicio y restricciones de recepción. |
| Eventos históricos | Entrada/salida de cola, posicionamiento, inicio/fin de carga, inicio/fin de descarga, viajes, carga transportada y fallas/reparaciones. |
| Plan | Turnos, metas, secuencia de frentes, destinos permitidos y ventanas de tronadura. |
| Externalidades | Clima, estado de caminos, interrupciones AHS/comunicaciones y clasificación consistente de demoras. |

## Validación y criterio de avance

1. **Verificar lógica:** ningún equipo simultáneamente carga y viaja; capacidades nunca se exceden; rutas y destinos inválidos se rechazan; balance de carga/toneladas y ocupación de recursos cierran.
2. **Calibrar:** ajustar distribuciones por tramo, equipo, carga y condición con una parte del histórico. Registrar unidades y supuestos.
3. **Validar fuera de muestra:** reproducir turnos diferentes y comparar t/h, colas, ciclo y estados. Acordar tolerancias con Operaciones antes de ajustar el modelo para evitar aceptar solo los indicadores favorables.
4. **Probar sensibilidad:** falla de pala, cierre de ruta, lluvia, mayor variabilidad y datos GPS incompletos. El sistema debe degradarse de forma explicable.
5. **Aceptar el candidato:** comprobar factibilidad y mejora estadística en semillas/turnos reservados; conservar escenario, versión, semillas y métricas para poder repetir la decisión.

El MVP permite revisar la experiencia y la lógica inicial. Los resultados de producción sintéticos no son una predicción de una faena real ni justifican por sí solos cambios de flota o despacho.
