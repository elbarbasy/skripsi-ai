import { NextRequest } from 'next/server';

// Always run on-demand (never statically cached) and read env at runtime.
export const dynamic = 'force-dynamic';

// Runtime backend base (NO trailing /api). Set this on the web service:
//   BACKEND_URL=https://<your-api-domain>.up.railway.app
const BACKEND = (process.env.BACKEND_URL ?? 'http://localhost:3001').replace(/\/$/, '');

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const search = req.nextUrl.search ?? '';
  const target = `${BACKEND}/api/${(path ?? []).join('/')}${search}`;

  // Clone request headers, drop hop-by-hop / host-specific ones.
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const method = req.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, redirect: 'manual' });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: `Proxy gagal menghubungi backend: ${(err as Error).message}` }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  // Forward the response, stripping headers that don't survive proxying.
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('content-encoding');
  resHeaders.delete('content-length');
  resHeaders.delete('transfer-encoding');

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new Response(buf, { status: upstream.status, headers: resHeaders });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
