import { handle } from './handler.ts';
import type { Env } from './handler.ts';
import { reject } from './http.ts';

export default {
  fetch: (request: Request, env: Env): Promise<Response> => handle(request, env).catch(() => reject(502, 'Proxy request failed.')),
};
