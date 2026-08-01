/** Helpers de desenho SVG portados de Patrimonio.dc.html. */

export type Point = [x: number, y: number];

/** Curva quadrática suave passando pelos pontos (mesma do design). */
export function smoothPath(points: readonly Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  }

  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const xc = (x0 + x1) / 2;
    const yc = (y0 + y1) / 2;
    d += ` Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
}

/**
 * Escala vertical tolerante a listas vazias, a um único ponto e a séries
 * constantes (onde min === max faria divisão por zero).
 */
export function verticalScale(values: readonly number[], padding = 0.02) {
  if (values.length === 0) return { min: 0, max: 1, range: 1 };

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);

  if (rawMin === rawMax) {
    const span = Math.abs(rawMin) * 0.1 || 1;
    return { min: rawMin - span, max: rawMax + span, range: span * 2 };
  }

  const span = rawMax - rawMin;
  const min = rawMin - span * padding;
  const max = rawMax + span * padding;
  return { min, max, range: max - min };
}

/** Distribui `count` pontos igualmente no eixo x; um ponto só fica no centro. */
export function xAt(index: number, count: number, padX: number, width: number): number {
  if (count <= 1) return width / 2;
  return padX + (index / (count - 1)) * (width - 2 * padX);
}
