// Dibuja flechas entre cajas (por id). lado: 'arr', 'aba', 'izq', 'der'. dx/dy corren el punto.
const NS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(NS, 'svg');
svg.setAttribute('class', 'capa');
svg.setAttribute('width', document.body.scrollWidth);
svg.setAttribute('height', document.body.scrollHeight);
svg.innerHTML = '<defs><marker id="p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#3a3a3a"/></marker><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1f3a68"/></marker></defs>';
document.body.appendChild(svg);
function punto(id, lado, d = 0) {
  const r = document.getElementById(id).getBoundingClientRect();
  if (lado === 'arr') return [r.left + r.width / 2 + d, r.top];
  if (lado === 'aba') return [r.left + r.width / 2 + d, r.bottom];
  if (lado === 'izq') return [r.left, r.top + r.height / 2 + d];
  return [r.right, r.top + r.height / 2 + d];
}
function linea(puntos, texto, { color = '#3a3a3a', punteada = false, ancho = 2, marca = 'p', posTexto = 0.5, txtDx = 0, txtDy = 0 } = {}) {
  const p = document.createElementNS(NS, 'polyline');
  p.setAttribute('points', puntos.map((q) => q.join(',')).join(' '));
  p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', ancho);
  if (punteada) p.setAttribute('stroke-dasharray', '6 5');
  p.setAttribute('marker-end', 'url(#' + marca + ')');
  svg.appendChild(p);
  if (texto) {
    // El texto va en el medio del tramo más largo.
    let mejor = 0, a = puntos[0], b = puntos[1];
    for (let i = 0; i < puntos.length - 1; i++) {
      const l = Math.hypot(puntos[i + 1][0] - puntos[i][0], puntos[i + 1][1] - puntos[i][1]);
      if (l > mejor) { mejor = l; a = puntos[i]; b = puntos[i + 1]; }
    }
    const x = a[0] + (b[0] - a[0]) * posTexto + txtDx, y = a[1] + (b[1] - a[1]) * posTexto + txtDy;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y + 4); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'etiqueta'); t.textContent = texto;
    if (color !== '#3a3a3a') { t.setAttribute('fill', color); t.style.fontSize = '13px'; }
    svg.appendChild(t);
    const bb = t.getBBox();
    const fondo = document.createElementNS(NS, 'rect');
    fondo.setAttribute('x', bb.x - 4); fondo.setAttribute('y', bb.y - 1); fondo.setAttribute('width', bb.width + 8); fondo.setAttribute('height', bb.height + 2);
    fondo.setAttribute('fill', '#fff');
    svg.insertBefore(fondo, t);
  }
}
function flecha(a, la, b, lb, texto, op = {}) {
  const p1 = punto(a, la, op.d1 || 0), p2 = punto(b, lb, op.d2 || 0);
  let pts = [p1, p2];
  // Codo: si una sale de costado y la otra entra de arriba/abajo (o al revés).
  if (op.codo === 'h') pts = [p1, [p2[0], p1[1]], p2];
  if (op.codo === 'v') pts = [p1, [p1[0], p2[1]], p2];
  linea(pts, texto, op);
}
