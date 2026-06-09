// Lightweight statistics helpers implemented in pure TypeScript.

export type Row = Record<string, string | number>;

export function toNumbers(values: (string | number)[]): number[] {
  return values
    .map((v) => (typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))))
    .filter((v) => Number.isFinite(v));
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}

export function std(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

/** Simple linear regression y = a + b*x. Returns slope, intercept, r2. */
export function linearRegression(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const r = pearson(xs, ys);
  return { slope, intercept, r2: r * r };
}

/** Multiple linear regression via normal equations (X'X)^-1 X'y. */
export function multipleRegression(X: number[][], y: number[]) {
  // Add intercept column.
  const Xa = X.map((row) => [1, ...row]);
  const Xt = transpose(Xa);
  const XtX = multiply(Xt, Xa);
  const XtY = multiplyVec(Xt, y);
  const beta = solve(XtX, XtY);
  // R^2
  const yMean = mean(y);
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < y.length; i++) {
    const pred = Xa[i].reduce((s, v, j) => s + v * beta[j], 0);
    ssRes += (y[i] - pred) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }
  return { coefficients: beta, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot };
}

/** Cronbach's alpha for reliability. items = columns, each array is one item's scores. */
export function cronbachAlpha(items: number[][]): number {
  const k = items.length;
  if (k < 2) return 0;
  const n = items[0].length;
  const itemVars = items.map((it) => variance(it));
  const totals: number[] = [];
  for (let i = 0; i < n; i++) {
    totals.push(items.reduce((s, it) => s + (it[i] ?? 0), 0));
  }
  const totalVar = variance(totals);
  if (totalVar === 0) return 0;
  const sumItemVar = itemVars.reduce((a, b) => a + b, 0);
  return (k / (k - 1)) * (1 - sumItemVar / totalVar);
}

// --- small linear algebra helpers ---
function transpose(m: number[][]): number[][] {
  return m[0].map((_, j) => m.map((row) => row[j]));
}
function multiply(a: number[][], b: number[][]): number[][] {
  return a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
}
function multiplyVec(a: number[][], v: number[]): number[] {
  return a.map((row) => row.reduce((s, val, k) => s + val * v[k], 0));
}
/** Gaussian elimination solver. */
function solve(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const pv = M[col][col] || 1e-9;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col] / pv;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-9));
}
