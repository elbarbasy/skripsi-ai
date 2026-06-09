import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import type { DataAnalysisResult } from '@skripsita/shared';
import { AiService } from '../../core/ai/ai.service';
import {
  cronbachAlpha,
  linearRegression,
  mean,
  multipleRegression,
  pearson,
  std,
  toNumbers,
  type Row,
} from './stats';

@Injectable()
export class DataAnalysisService {
  constructor(private readonly ai: AiService) {}

  parse(file: Express.Multer.File): { columns: string[]; rows: Row[] } {
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' });
    const columns = rows.length ? Object.keys(rows[0]) : [];
    return { columns, rows };
  }

  numericColumns(columns: string[], rows: Row[]): string[] {
    return columns.filter((c) => {
      const nums = toNumbers(rows.map((r) => r[c]));
      return nums.length >= rows.length * 0.6;
    });
  }

  async analyze(
    file: Express.Multer.File,
    kind: 'statistic' | 'ml' | 'expert',
    method: string,
    options: { target?: string; features?: string[] } = {},
  ): Promise<DataAnalysisResult> {
    const { columns, rows } = this.parse(file);
    if (!rows.length) throw new BadRequestException('Dataset kosong atau tidak terbaca.');
    const numCols = this.numericColumns(columns, rows);

    if (kind === 'statistic') return this.runStatistic(method, columns, rows, numCols, options);
    // ML & expert: compute a profile, then ask AI to produce methodology + interpretation.
    return this.runAiAssisted(kind, method, columns, rows, numCols, options);
  }

  private runStatistic(
    method: string,
    columns: string[],
    rows: Row[],
    numCols: string[],
    options: { target?: string; features?: string[] },
  ): DataAnalysisResult {
    const tables: DataAnalysisResult['tables'] = [];
    const metrics: Record<string, number | string> = {};

    if (method === 'validitas') {
      const target =
        options.target ?? numCols[numCols.length - 1];
      const items = numCols.filter((c) => c !== target);
      const totals = rows.map((r) => items.reduce((s, c) => s + (toNumbers([r[c]])[0] ?? 0), 0));
      const tableRows = items.map((c) => {
        const col = toNumbers(rows.map((r) => r[c]));
        const r = pearson(col, totals.slice(0, col.length));
        return [c, r.toFixed(3), Math.abs(r) >= 0.3 ? 'Valid' : 'Tidak Valid'];
      });
      tables.push({ title: 'Uji Validitas (korelasi item-total)', columns: ['Item', 'r', 'Keterangan'], rows: tableRows });
    } else if (method === 'reliabilitas') {
      const items = numCols.map((c) => toNumbers(rows.map((r) => r[c])));
      const alpha = cronbachAlpha(items);
      metrics.cronbach_alpha = Number(alpha.toFixed(3));
      metrics.keterangan = alpha >= 0.7 ? 'Reliabel' : 'Kurang reliabel';
    } else if (method === 'regresi_linear') {
      const [x, y] = options.features?.length
        ? [options.features[0], options.target ?? numCols[1]]
        : [numCols[0], numCols[1]];
      const xs = toNumbers(rows.map((r) => r[x]));
      const ys = toNumbers(rows.map((r) => r[y]));
      const { slope, intercept, r2 } = linearRegression(xs, ys);
      metrics.persamaan = `Y = ${intercept.toFixed(3)} + ${slope.toFixed(3)}X`;
      metrics.r_squared = Number(r2.toFixed(3));
      metrics.x = x;
      metrics.y = y;
    } else if (method === 'regresi_berganda') {
      const target = options.target ?? numCols[numCols.length - 1];
      const features = (options.features?.length ? options.features : numCols.filter((c) => c !== target));
      const X = rows.map((r) => features.map((f) => toNumbers([r[f]])[0] ?? 0));
      const y = toNumbers(rows.map((r) => r[target]));
      const { coefficients, r2 } = multipleRegression(X, y);
      metrics.intercept = Number(coefficients[0].toFixed(3));
      features.forEach((f, i) => (metrics[`b_${f}`] = Number(coefficients[i + 1].toFixed(3))));
      metrics.r_squared = Number(r2.toFixed(3));
    }

    // Descriptive table for all numeric columns.
    tables.unshift({
      title: 'Statistik Deskriptif',
      columns: ['Variabel', 'N', 'Mean', 'Std', 'Min', 'Max'],
      rows: numCols.map((c) => {
        const v = toNumbers(rows.map((r) => r[c]));
        return [c, v.length, mean(v).toFixed(2), std(v).toFixed(2), Math.min(...v), Math.max(...v)];
      }),
    });

    return {
      kind: 'statistic',
      method,
      summary: `Analisis ${method} pada ${rows.length} observasi dan ${numCols.length} variabel numerik.`,
      metrics,
      tables,
      interpretation: this.basicInterpretation(method, metrics),
    };
  }

  private basicInterpretation(method: string, metrics: Record<string, number | string>): string {
    if (method === 'reliabilitas') {
      return `Nilai Cronbach's Alpha sebesar ${metrics.cronbach_alpha} menunjukkan instrumen ${metrics.keterangan}.`;
    }
    if (method === 'regresi_linear') {
      return `Diperoleh persamaan ${metrics.persamaan} dengan koefisien determinasi R² = ${metrics.r_squared}.`;
    }
    if (method === 'regresi_berganda') {
      return `Model regresi berganda memiliki R² = ${metrics.r_squared}.`;
    }
    return 'Lihat tabel hasil untuk detail analisis.';
  }

  private async runAiAssisted(
    kind: 'ml' | 'expert',
    method: string,
    columns: string[],
    rows: Row[],
    numCols: string[],
    options: { target?: string; features?: string[] },
  ): Promise<DataAnalysisResult> {
    const profile = {
      n: rows.length,
      columns,
      numericColumns: numCols,
      sample: rows.slice(0, 5),
      target: options.target,
      features: options.features,
    };
    const prompt = `Anda analis data skripsi. Berdasarkan profil dataset berikut, jelaskan penerapan metode ${method} (${kind === 'ml' ? 'machine learning' : 'sistem pakar'}).
Jawab JSON valid:
{"summary": string, "metrics": object (estimasi/akurasi bila relevan), "interpretation": string (narasi akademik untuk BAB IV)}

PROFIL DATASET:
${JSON.stringify(profile)}`;
    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.4,
      maxTokens: 2000,
    });
    let parsed: { summary?: string; metrics?: Record<string, number | string>; interpretation?: string } = {};
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { summary: raw, interpretation: raw, metrics: {} };
    }
    return {
      kind,
      method,
      summary: parsed.summary ?? '',
      metrics: parsed.metrics ?? {},
      tables: [
        {
          title: 'Cuplikan Data',
          columns,
          rows: rows.slice(0, 10).map((r) => columns.map((c) => r[c])),
        },
      ],
      interpretation: parsed.interpretation ?? '',
    };
  }
}
