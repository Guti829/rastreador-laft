# Rastreador LA/FT

Juego de 60 segundos para el Día Nacional de la Prevención del Lavado de Activos (29 de octubre). El jugador mueve una lupa para atrapar señales de alerta y controles, evita operaciones normales (falsos positivos) y termina con un reto de 3 preguntas SARLAFT.

## Cómo se guardan los puntajes

1. **Google Sheets (ranking general):** cada partida se envía a una hoja de cálculo y el ranking se muestra en el juego.
2. **Código por WhatsApp:** cada partida genera un código `RLA-puntos-XXXXX` que el jugador envía al oficial de cumplimiento. Se valida en el juego, en "Moderador: verificar un código de resultado".

Si `config.js` no tiene la URL de Apps Script, el juego funciona con ranking local y código por WhatsApp.

## Conectar Google Sheets (una sola vez)

1. Crea una hoja de cálculo nueva en Google Drive, por ejemplo "Ranking Rastreador LA/FT".
2. Abre **Extensiones > Apps Script**, borra el contenido y pega el archivo `apps-script/Code.gs`.
3. Elige la función `configurar` y pulsa **Ejecutar**. Acepta los permisos. Se crean las pestañas *Partidas* y *Ranking*.
4. Pulsa **Implementar > Nueva implementación > Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copia la URL que termina en `/exec` y pégala en `config.js`, en `sheetsUrl`.
6. Sube el cambio de `config.js` al repositorio. GitHub Pages se actualiza en 1 o 2 minutos.

Si luego cambias `Code.gs`, usa **Implementar > Administrar implementaciones > Editar > Nueva versión** para conservar la misma URL.

## Archivos

- `index.html`: el juego completo.
- `config.js`: URL del backend de Google Sheets.
- `apps-script/Code.gs`: backend del ranking.
