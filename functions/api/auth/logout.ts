import { clearSessionCookie, revokeSession } from '../_lib/auth';
import { noContent } from '../_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  await revokeSession(env.DB, request);
  return noContent({ 'Set-Cookie': clearSessionCookie() });
};
