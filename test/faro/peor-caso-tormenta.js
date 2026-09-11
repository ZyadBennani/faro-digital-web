/* `/test/faro` v3 · EL PEOR CASO DE LA ESCENA, para medir contraste.
 *
 * Una escena viva no tiene un fondo: tiene un rango. Esto deja la pieza en su
 * estado MÁS CLARO antes de capturar. Escritorio: mezcla = 1 (la tormenta entera)
 * y los dos bucles parados, con el de tormenta en su fotograma más claro dentro
 * de la máscara del mar (el 77 de 96, 3,208 s, p98 75/255). Móvil: el bucle de
 * calma parado en su fotograma más claro (el 73 de 96, 3,042 s, p98 73/255) y el
 * velo donde lo deje el scroll. Es el peor estado de cada altura de scroll.
 *
 * Uso:  python contraste-sobre-escena.py <destino> --peor-caso peor-caso-tormenta.js
 */
async () => {
  const c = document.querySelector('.pieza');
  if (!c || !c.pieza) return 'no hay pieza viva (' + (c && c.dataset.pieza) + ')';
  const espera = (f, ms) => new Promise(ok => { const t0 = Date.now(); const p = () => { if (f() || Date.now() - t0 > ms) ok(f()); else setTimeout(p, 50); }; p(); });
  await espera(() => { const e = c.pieza.estado(); return e.vivo && e.videos && e.videos[0].rs >= 2; }, 15000);
  const modo = c.pieza.estado().modo;
  const ok = await c.pieza.congelar(modo === 'movil' ? 3.042 : 3.208);
  const e = c.pieza.estado();
  return (modo === 'movil' ? 'bucle de calma parado en ' + e.videos[0].t : 'mezcla forzada a 1 · bucles parados · tormenta en ' + (e.videos[1] ? e.videos[1].t : '?')) + ' s · ' + (ok ? 'en su fotograma' : 'NO llegó al fotograma') + ' · ' + e.modo + ':' + e.formato;
}
