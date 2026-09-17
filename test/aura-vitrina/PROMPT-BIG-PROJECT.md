# PROMPT · jurado de la vitrina de Aura (sesión 2)

> Autocontenido: no hace falta haber visto la sesión 1 ni abrir el repositorio.
> Copiar de aquí abajo.

---

Eres el jurado de una pieza web. No has visto nada de este proyecto antes y eso
es exactamente lo que se busca: la vitrina la van a ver personas que tampoco.

**Míralo aquí, en vivo, y gíralo con el ratón:**
https://faro-digital.pages.dev/test/aura-vitrina/

Y las capturas, si prefieres estáticas:
`C:\Users\zyadb\Desktop\IA\faro-digital-web\Renders\aura-s2\`
· `ANTES-DESPUES.png` — la vitrina de hoy al lado de la nueva, a 1440 y a 390
· `vitrina-reposo-1440.png` y `vitrina-serum-1440.png`
· `seccion-390.png` — el móvil entero
· `CONTROL-sombra.png` — el control negativo de la sombra de contacto

---

## Qué es

La sección «tienda» de **Aura**, una marca de cosmética **ficticia** que Faro
Digital usa como caso de portfolio. Tres productos en línea sobre el papel de la
página, con la lista de precios a la derecha. Al elegir uno, se acerca un 12 %,
gira 15° hacia la cámara y **se deja girar en todas direcciones** con el ratón o
el dedo; los otros dos retroceden y bajan de tono. A los 3 segundos sin tocarlo,
vuelve solo a su sitio.

Los tres frascos son **modelos 3D reales** (Sketchfab, CC BY 4.0 de Iron_bound),
no dibujos: 34.264 triángulos en total, 104 KB comprimidos con Draco. El vidrio,
el líquido, las etiquetas, las dos sombras y el plató de luz se calculan en el
navegador.

| | ALBA · sérum | VELO · crema | ROCÍO · bruma |
|---|---|---|---|
| | 30 ml · 48 € | 50 ml · 39 € | 75 ml · 32 € |
| Alto real | 10,90 cm | 9,12 cm | 16,11 cm |

## Lo que ya está medido, para que no gastes tiempo en ello

Chrome instalado, ventana al frente, GPU real comprobada:

- Peso de la sección **417,8 KB gzip** (puerta: ≤ 1.400)
- **LCP 244 ms** (puerta: ≤ 2.500)
- **60,1 fps con la CPU estrangulada ×4**, en reposo y girando (puerta: ≥ 55)
- **INP 48 ms** (puerta: ≤ 200)
- El papel del lienzo mide `#F5EFE4` contra el `#F5EFE4` de la página, **desvío
  0/255**, y la costura entre lienzo y página es **1/255 en los doce bordes**
- En móvil, el scroll de la página **se mueve 520 px en mitad de un giro**
- Etiquetas con la tipografía real del sitio: desvío 0,4 / 2,0 / 2,4 %

**No hace falta que juzgues el rendimiento ni la técnica.** Está medido y en
verde. Juzga lo que ningún número dice.

## Lo que ya sabemos que está mal, para que no lo repitas

1. **ROCÍO no se lee como vidrio.** Se probó tintar el vidrio y empeoró los
   tres. Su silueta es la de un envase de plástico con vaporizador. Lo sabemos.
2. **ROCÍO mide 16,1 cm contra los 9,1 de VELO**, porque la altura sale del
   volumen declarado. Es real y desequilibra la fila. Lo sabemos.
3. Sin WebGL2 hay un póster de reserva, y la lista sigue funcionando, pero la
   imagen no cambia al elegir. Lo sabemos.
4. La cáustica —el charco de luz dentro de la sombra— es falsa: una textura, no
   un cálculo. Lo sabemos.

## Lo que te pido

1. **Una nota del 1 al 10**, en escritorio y otra en móvil, y **la frase que
   explica la diferencia entre las dos** si la hay.
2. **En reposo, sin tocar nada: ¿cuál de los tres parece más caro?** Dime el
   nombre y, en una frase, **qué te lo hace pensar** — si es el tamaño, el
   color, la etiqueta, el tapón o la posición. *(Esta pregunta importa más que
   la nota: ALBA cuesta 48 € y es el producto que la tienda quiere vender. Si
   el que parece más caro es otro, la vitrina cuenta mal el precio por bien que
   gire.)*
3. **Gíralo.** Arrastra un frasco a un lado, suéltalo a media vuelta, y dime si
   el movimiento se siente **como girar un objeto en la mano** o como mover un
   control. Y si te sorprendió que **se pudiera** girar sin que nadie te lo
   dijera: no hay ningún cartel de «toca aquí», a propósito.
4. **Tres cosas concretas que la vitrina de un e-commerce de cosmética de verdad
   tiene y esta no.** Concretas y accionables — «falta calidez» no sirve; «falta
   ver la textura del producto al trasluz» sí.
5. **Una sola cosa que quitarías.** No que añadirías: que quitarías.
6. **Mira `ANTES-DESPUES.png` y dime si el cambio es un salto o un empate.** El
   «antes» es la vitrina que está publicada hoy en el caso de Aura. Si crees que
   la vieja gana en algo —aunque sea en una sola cosa— dilo, que es justo lo que
   nadie va a decir por su cuenta.

Responde en español, en prosa, sin listas de adjetivos.
