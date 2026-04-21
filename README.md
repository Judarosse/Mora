Monitoreo sustentable de variables críticas en cultivos piscícolas de la Región del Magdalena Medio
________________________________________
1. Introducción
Contexto
El proyecto se desarrolló en un entorno rural del Magdalena Medio, en el marco de una experiencia de acuicultura experimental previa a la introducción de organismos vivos. La zona carece de acceso a tecnologías avanzadas de medición en tiempo real, por lo que el control de la calidad del agua suele realizarse mediante pruebas manuales, discontinuas y costosas. Las variables fisicoquímicas del agua —pH, oxígeno disuelto (OD), conductividad eléctrica (EC) y temperatura— son determinantes para la supervivencia, el crecimiento y la productividad de las especies acuáticas, lo que hace indispensable su monitoreo continuo y confiable.
La problemática central identificada fue la inexistencia de un sistema automatizado que permitiera visualizar estas variables en tiempo real, generar alertas ante valores fuera de rango y almacenar registros históricos para análisis y toma de decisiones. Esta limitación incrementa el riesgo de pérdidas productivas y dificulta una gestión preventiva del recurso hídrico en contextos rurales.
Objetivo del documento
Diseñar un sistema de monitoreo y visualización en tiempo real de la calidad del agua en entornos acuícolas, basado en tecnologías IoT de bajo costo, que permita supervisar variables críticas, generar alertas y apoyar la toma de decisiones en criaderos piscícolas del Magdalena Medio.
________________________________________
2. Desarrollo / Contenido principal
2.1 Acciones realizadas
Diseño metodológico y evolución del prototipo
•	Desarrollo progresivo del sistema a partir de pruebas iniciales con Arduino Uno y sensores básicos (DHT11 y LM35).
•	Migración hacia sensores específicos para ambientes acuáticos: DS18B20 para temperatura y sensores analógicos para pH, oxígeno disuelto (OD) y conductividad eléctrica (EC), mejorando precisión y confiabilidad.
•	Evolución de la plataforma central desde Raspberry Pi Zero hacia Raspberry Pi 4, incrementando capacidad de procesamiento, estabilidad y posibilidades de visualización.
Arquitectura del sistema
•	Diseño de una arquitectura distribuida, modular y escalable, con nodos emisores remotos y un gateway central.
•	Enfoque IoT orientado a bajo consumo, bajo costo y replicabilidad en entornos rurales.
Nodos emisores (campo)
•	Implementación de nodos con TTGO T-Beam (ESP32 + LoRa + GPS).
•	Integración de sensores:
o	Temperatura: DS18B20 (digital).
o	pH, Conductividad Eléctrica (EC) y Oxígeno Disuelto (OD): sensores analógicos.
•	Inclusión de pantalla LCD para visualización local de variables.
•	Adquisición periódica de datos y empaquetado en un formato estructurado:
Lat=7.065805,Lon=-73.851259,Sat=9,Msg=Temp: 31.81 °C pH: 5.11 EC: 0.00 mS/cm DO: 0.15 mg/L
•	Transmisión de datos mediante LoRa hacia el nodo receptor.
Nodo receptor y gateway
•	Uso de un segundo TTGO T-Beam como receptor LoRa.
•	Comunicación por UART con una Raspberry Pi 4, que actúa como nodo central.
Procesamiento, visualización y almacenamiento
•	Desarrollo de scripts en Python para lectura serial, validación de tramas y filtrado de datos incompletos o corruptos.
•	Publicación de datos limpios en un broker MQTT.
•	Almacenamiento local de todos los registros en archivos de texto plano para trazabilidad.
•	Desarrollo de dashboard web con HTML, CSS y JavaScript, y pruebas de integración con Node-RED y plataformas IoT en la nube.
Alertas y control
•	Definición de rangos seguros para cada variable.
•	Implementación de notificaciones automáticas vía WhatsApp (CallMeBot) ante valores críticos.
•	Pruebas iniciales de control de actuadores mediante relés y cargas (bombillos), como base para futuros sistemas de oxigenación y recirculación.
________________________________________
2.2 Resultados obtenidos
•	Sistema completamente funcional y estable, compuesto por:
o	Nodos emisores LoRa distribuidos en los estanques.
o	Nodo receptor conectado a Raspberry Pi 4.
o	Gateway MQTT, almacenamiento local y dashboard web.
•	Visualización en tiempo real de las variables de calidad del agua.
•	Tiempo extremo a extremo (sensor → web) menor a 2 segundos.
•	Comunicación LoRa estable, con alcance efectivo superior a 200 m en pruebas sin obstáculos.
•	Sistema de alarmas operativo, con recepción de mensajes por WhatsApp ante condiciones críticas.
•	Interfaz clara, usable y orientada a operación diaria en campo.
________________________________________
2.3 Dificultades encontradas
•	Recepción de tramas incompletas o solo con datos GPS, que generaban valores nulos en la web (resuelto mediante filtrado en la Raspberry Pi).
•	Dependencia de Wi Fi para el envío MQTT y la visualización web, vulnerable en zonas rurales.
•	Latencia ocasional al acceder remotamente mediante ngrok.
•	Dependencia de baterías convencionales en los nodos emisores, limitando la autonomía.
________________________________________
2.4 Validación biológica y comportamiento de los peces
Durante la fase experimental del proyecto, el sistema de monitoreo fue evaluado en condiciones reales utilizando peces vivos durante un periodo aproximado de 2 a 3 meses. Esto permitió correlacionar las variables fisicoquímicas medidas por los sensores con el comportamiento y la supervivencia de los organismos acuáticos.
Se mantuvo un ejemplar de Pangasianodon hypophthalmus (pangasius) como especie principal de observación. El pez mostró cambios evidentes en su comportamiento en función de la calidad del agua. En episodios donde el pH descendió a valores cercanos a 4, el pez presentó letargo, baja respuesta a estímulos externos y disminución de su actividad normal. A medida que el pH fue recuperándose progresivamente hacia valores cercanos a 6, el pez volvió a mostrar respuestas rápidas y comportamiento más activo, evidenciando una relación directa entre los parámetros medidos y el estado fisiológico del animal.
Durante el mismo periodo también se mantuvieron peces Carassius auratus (goldfish). Algunos de estos ejemplares murieron debido a cambios de agua realizados sin control adecuado de la temperatura, lo que generó choques térmicos. Este evento evidenció la importancia de no solo monitorear variables químicas como el pH y la conductividad, sino también la temperatura como parámetro crítico para la supervivencia de las especies.
Todas las mediciones realizadas durante el proyecto se obtuvieron mediante sensores previamente calibrados utilizando soluciones buffer de referencia
________________________________________
2.5 Influencia de la radiación solar y la filtración en la calidad del agua
Durante las pruebas realizadas en el estanque principal de aproximadamente 500 L, se observó un crecimiento excesivo de algas, que llegó a provocar una coloración verde intensa del agua. Tras el análisis de las condiciones del sistema, se determinó que este fenómeno estaba directamente relacionado con la exposición prolongada a la radiación solar y la ausencia de un sistema de filtración con capacidad suficiente para el volumen del estanque.
La proliferación de algas generó un desequilibrio en el ecosistema acuático, afectando el ciclo del nitrógeno y provocando un aumento en las concentraciones de amoníaco. Este incremento en compuestos nitrogenados produjo estrés fisiológico en los peces, evidenciado por cambios en su comportamiento, menor actividad y periodos prolongados de inmovilidad.
Simultáneamente, la acumulación de desechos orgánicos y la descomposición de materia vegetal en el agua contribuyeron a una disminución progresiva del pH. Este descenso fue registrado por los sensores y posteriormente correlacionado con el deterioro de las condiciones biológicas del estanque y el estrés observado en el ejemplar de Pangasianodon hypophthalmus mantenido en el sistema.
La experiencia permitió identificar que la combinación de alta radiación solar, crecimiento algal y filtración insuficiente genera un entorno inestable, donde el aumento de amoníaco y la caída del pH ocurren de forma simultánea, afectando directamente la salud de los peces y confirmando la necesidad de monitoreo continuo y control de variables ambientales.
________________________________________
Observaciones y mejoras relacionadas con la medición de conductividad eléctrica:
•	Durante las pruebas se evidenció que el sensor de conductividad eléctrica del agua utilizado posee un rango de medición de 0 a 20 mS/cm, lo cual resulta adecuado para aplicaciones en aguas salobres o con alta mineralización, pero limita su resolución en ecosistemas de agua dulce donde las variaciones de conductividad son pequeñas. 
•	En el sistema piscícola evaluado, las variaciones de conductividad se encontraban en un rango bajo, por lo que el sensor no permitió detectar cambios finos asociados a la acumulación de desechos, sales disueltas o procesos biológicos. 
•	Se recomienda, como mejora futura, emplear sensores con mayor resolución en rangos bajos (por ejemplo 0–2 mS/cm), más apropiados para monitoreo de agua dulce, acuarios 
•	El rango actual del sensor es más adecuado para aplicaciones como monitoreo de acuicultura marina, control de salinidad en sistemas de acuaponía con agua salobre o procesos industriales donde la conductividad presenta valores elevados y variaciones más amplias.
________________________________________
3. Conclusiones
•	El proyecto valida la factibilidad técnica de un sistema IoT de bajo costo para el monitoreo continuo de la calidad del agua en entornos piscícolas rurales.
•	La evolución del prototipo permitió mejorar progresivamente la precisión de las mediciones, la estabilidad del sistema y la experiencia de usuario.
•	La integración de sensores, comunicación LoRa, Raspberry Pi, MQTT, visualización web y alertas automáticas demostró ser efectiva y confiable.
•	El sistema proporciona información en tiempo real, registro histórico y capacidad de respuesta temprana ante condiciones adversas, fortaleciendo la gestión preventiva del cultivo.
•	La arquitectura modular facilita la escalabilidad y la futura automatización de procesos críticos en acuicultura.
•	La validación del sistema en presencia de peces vivos durante varios meses permitió confirmar que las mediciones obtenidas reflejan de manera fiel las condiciones reales del agua, ya que los cambios en las variables monitoreadas se correspondieron con alteraciones observables en el comportamiento y la supervivencia de los organismos acuáticos.
________________________________________
4. Recomendaciones o mejoras
•	Implementar aseguramiento metrológico formal de los sensores (calibración periódica y validación cruzada).
•	Incorporar reintentos automáticos y almacenamiento en cola ante fallos de red o MQTT.
•	Desarrollar una interfaz móvil adaptativa para facilitar el uso en campo.
•	Integrar sistemas de energía solar para lograr autonomía total de los nodos.
•	Evaluar el uso de LoRaWAN para ampliar cobertura y reducir infraestructura local.
•	Incorporar análisis histórico, gráficas de tendencia y reglas inteligentes para automatizar actuadores.
•	Incrementar la capacidad de aireación y circulación del agua para mejorar los niveles de oxígeno disuelto y favorecer la estabilidad del ecosistema.
•	Mantener protocolos de cambios de agua graduales y control de temperatura para evitar estrés fisiológico y choques térmicos en los peces.
•	Reducir la exposición directa a la radiación solar mediante polisombra o vegetación flotante para disminuir la proliferación de algas y procesos de eutrofización.
•	Implementar un sistema de filtración biológica con mayor capacidad para estabilizar el ciclo del nitrógeno y reducir la acumulación de amoníaco en el agua.
________________________________________


<img width="3024" height="4032" alt="primera estructura del cajón receptor" src="https://github.com/user-attachments/assets/35129ce3-5813-4fd5-835b-812ee2348f48" />
<img width="1200" height="1600" alt="nodo" src="https://github.com/user-attachments/assets/c8ed8678-9350-44fc-ad33-3efab39ed5af" />
<img width="527" height="296" alt="imagen" src="https://github.com/user-attachments/assets/e16977ea-107c-47e5-809f-4576e49e582a" />











 

 




