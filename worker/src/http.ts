export const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export const reject = (status: number, message: string): Response =>
  json({ errors: [{ message: `shopify-cli-condom-proxy: ${message}` }] }, status);

export async function readBody(request: Pick<Request, 'headers' | 'body'>, limit: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) return null;
  const reader = request.body?.getReader();
  const bytes = new Uint8Array(limit);
  let size = 0;
  if (!reader) return bytes.subarray(0, 0);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return bytes.subarray(0, size);
      if (value.length > limit - size) {
        await reader.cancel();
        return null;
      }
      bytes.set(value, size);
      size += value.length;
    }
  } finally {
    reader.releaseLock();
  }
}
