# Fuerza Tracker v2

PWA para iPhone enfocada en tu flujo real de entrenamiento.

## Qué hace
- Guarda localmente **cada cambio de kg, reps y RIR** en el momento en que lo escribes.
- Botón **Guardar** inicia el descanso y confirma la serie.
- 3 series iniciales por ejercicio, con opción de agregar o quitar.
- Cronómetro independiente por ejercicio.
- **Finalizar ejercicio** lo agrupa arriba mostrando solo el nombre.
- Tocar el nombre de un ejercicio finalizado lo reabre con sus datos intactos.
- **Orden editable de ejercicios** mediante flechas ↑ ↓. El orden queda guardado.
- Historial por sesión.
- Progreso por ejercicio con:
  - carga máxima
  - mejor serie de reps
  - volumen total (kg × reps)
  - e1RM estimado con fórmula de Epley
  - gráfico de evolución
  - récords
- Comparación de reps contra la última sesión disponible; para la primera sesión usa la referencia inicial.
- Exportación JSON / CSV e importación JSON.
- Funciona offline después de instalarla.

## Persistencia
Los datos se guardan en `localStorage` del navegador / PWA del iPhone bajo la clave `fuerza_tracker_v1`.
La v2 migra automáticamente los datos de la primera versión si ya existían.

## Instalar en iPhone
### GitHub Pages
1. Crea un repositorio en GitHub.
2. Sube **todos** los archivos de esta carpeta a la raíz.
3. En GitHub: Settings → Pages.
4. Build and deployment → Deploy from a branch.
5. Selecciona `main` y `/root`.
6. Abre la URL publicada en Safari.
7. Compartir → **Añadir a pantalla de inicio**.

## Recomendación de backup
Los datos están en el dispositivo. Usa **Datos → Exportar JSON** periódicamente, especialmente antes de borrar datos de Safari o cambiar de iPhone.
