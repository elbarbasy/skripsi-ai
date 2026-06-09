'use client';

import * as React from 'react';

export function Mermaid({ chart }: { chart: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const id = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
        const { svg } = await mermaid.render(`m-${id}`, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error)
    return (
      <pre className="overflow-auto rounded-md bg-muted p-3 text-xs text-destructive">
        Gagal merender diagram: {error}
        {'\n\n'}
        {chart}
      </pre>
    );

  return <div ref={ref} className="flex justify-center overflow-auto rounded-md border bg-white p-4" />;
}

/** Download the currently rendered SVG (and a PNG) from a container. */
export function downloadDiagram(container: HTMLElement | null, filename: string, format: 'svg' | 'png') {
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const serialized = new XMLSerializer().serializeToString(svg);

  if (format === 'svg') {
    const blob = new Blob([serialized], { type: 'image/svg+xml' });
    triggerDownload(URL.createObjectURL(blob), `${filename}.svg`);
    return;
  }

  const img = new Image();
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      triggerDownload(canvas.toDataURL('image/png'), `${filename}.png`);
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function triggerDownload(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
}
