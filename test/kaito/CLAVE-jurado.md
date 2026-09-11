# CLAVE del jurado a ciegas · 03-sep-2026

**No abrir antes de tener las notas.** Este archivo vive FUERA de las carpetas del jurado, en `test/kaito/`, para que se pueda entregar `_capturas/jurado/` entera sin romper el ciego.

## Carpeta `_capturas/jurado/`

| Letra | Portada | URL |
|---|---|---|
| **A** | Bureau for Visual Affairs (referencia externa) | https://bureau-va.com |
| **B** | /test/kaito (el test) | https://faro-digital.pages.dev/test/kaito/ |
| **C** | Home actual de Faro | https://faro-digital.pages.dev/ |

## Carpeta `_capturas/jurado-2/` — las MISMAS capturas con A y C intercambiadas

Sirve para comprobar que la nota no depende del orden de presentación: si una portada sube o baja más de medio punto entre las dos pasadas, la diferencia es del orden, no del diseño.

| Letra en jurado-2 | Portada | URL |
|---|---|---|
| **C** | Bureau for Visual Affairs (referencia externa) | https://bureau-va.com |
| **B** | /test/kaito (el test) | https://faro-digital.pages.dev/test/kaito/ |
| **A** | Home actual de Faro | https://faro-digital.pages.dev/ |

## Cambio de la tercera referencia

Se pidió **locomotive.ca** y no se ha podido usar: ese dominio responde con una pantalla de verificación anti-bot («One moment, please… Please wait while your request is being verified»), y lo único capturable es esa pantalla de espera, no la portada. No se ha intentado sortear la verificación. En su lugar va **bureau-va.com**, que es la referencia 01 de la biblioteca del sistema (`Biblioteca-Referencias/Web/Recetas/01-Bureau-identidad.md`), carga entera y da 8 pantallas a 1440. Si se prefiere otra, recapturar cuesta unos minutos: Studio Freight (basement.studio, 7,5 pantallas) y Symphony (symphony.is, 16,9) también cargan; Metalab devuelve una sola pantalla.

⚠️ La primera tanda de capturas de locomotive.ca (8 y 12 pantallas) era **material inválido**: fotogramas de la animación de la pantalla de espera. El capturador ahora aborta si detecta una pantalla de verificación.

## Cómo se capturó

Tres portadas × dos anchos (1440×900 y 390×844) × cuatro piezas: arriba, una pantalla de scroll, dos pantallas y la página entera cosida pantalla a pantalla. **Todo a device_scale_factor 2**, PNG sin optimizar (formato sin pérdida), capturas de viewport: sin barra de navegador, sin favicon y sin metadatos.

```json
{
 "home-actual": {
  "1440x900": {
   "pantallas_cosidas": 12,
   "px_imagen": "2880x21600",
   "dpr_efectivo": 2.0,
   "nitidez_bordes": 6.51,
   "scroll": "nativo"
  },
  "390x844": {
   "pantallas_cosidas": 14,
   "px_imagen": "780x23632",
   "dpr_efectivo": 2.0,
   "nitidez_bordes": 10.26,
   "scroll": "nativo"
  }
 },
 "test-kaito": {
  "1440x900": {
   "pantallas_cosidas": 9,
   "px_imagen": "2880x16200",
   "dpr_efectivo": 2.0,
   "nitidez_bordes": 4.79,
   "scroll": "nativo"
  },
  "390x844": {
   "pantallas_cosidas": 15,
   "px_imagen": "780x25320",
   "dpr_efectivo": 2.0,
   "nitidez_bordes": 2.89,
   "scroll": "nativo"
  }
 },
 "referencia": {
  "1440x900": {
   "pantallas_cosidas": 8,
   "px_imagen": "2880x14400",
   "dpr_efectivo": 2.0,
   "nitidez_bordes": 2.56,
   "scroll": "nativo"
  },
  "390x844": {
   "pantallas_cosidas": 11,
   "px_imagen": "780x18568",
   "dpr_efectivo": 2.0,
   "nitidez_bordes": 5.49,
   "scroll": "nativo"
  }
 }
}
```

---

# Jurado de MÓVIL · ronda B12 · 03-sep-2026

Mismo reparto de letras que el jurado de escritorio, para que las dos rondas se puedan comparar sin traducir nada.

## Carpeta `_capturas/jurado-movil/`

| Letra | Portada | URL |
|---|---|---|
| **A** | Bureau for Visual Affairs (referencia externa) | https://bureau-va.com |
| **B** | /test/kaito (el test) | https://faro-digital.pages.dev/test/kaito/ |
| **C** | Home actual de Faro | https://faro-digital.pages.dev/ |

## Carpeta `_capturas/jurado-movil-2/` — A y C intercambiadas

| Letra en jurado-movil-2 | Portada | URL |
|---|---|---|
| **C** | Bureau for Visual Affairs (referencia externa) | https://bureau-va.com |
| **B** | /test/kaito (el test) | https://faro-digital.pages.dev/test/kaito/ |
| **A** | Home actual de Faro | https://faro-digital.pages.dev/ |

## Qué contiene

12 PNG por carpeta: tres portadas × **390×844** × cuatro vistas (arriba, una pantalla de scroll, dos pantallas, página entera cosida). Todo a **device_scale_factor 2**, PNG sin optimizar, capturas de viewport sin barra de navegador ni favicon. El prompt está en `PROMPT-Jurado-movil.md`, dentro de las dos carpetas.

La portada del test es la **publicada después de la ronda B12**: CTA en la cabecera móvil, sección 2 sin repetir la foto del hero, encuadre del vídeo de cierre desplazado y CTA sin partir mal.

```json
{
 "home-actual": {
  "pantallas_cosidas": 14,
  "px": "780x23632",
  "dpr_efectivo": 2.0,
  "scroll": "nativo"
 },
 "test-kaito": {
  "pantallas_cosidas": 15,
  "px": "780x25320",
  "dpr_efectivo": 2.0,
  "scroll": "nativo"
 },
 "referencia": {
  "pantallas_cosidas": 11,
  "px": "780x18568",
  "dpr_efectivo": 2.0,
  "scroll": "nativo"
 }
}
```
