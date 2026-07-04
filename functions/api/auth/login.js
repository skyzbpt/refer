import { json, handleOptions, hashPassword, signJWT } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const email    = (body.email    || '').trim().toLowerCase();
  const password = (body.password || '');

  if (!email || !password) return json({ error: '請填寫 Email 與密碼' }, 400);

  const row = await env.DB.prepare(
    'SELECT uid, name, email, password_hash, password_salt FROM users WHERE email = ?'
  ).bind(email).first();

  if (!row) return json({ error: 'Email 或密碼不正確' }, 401);

  const { hash } = await hashPassword(password, row.password_salt);
  if (hash !== row.password_hash) return json({ error: 'Email 或密碼不正確' }, 401);

  const exp   = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
  const token = await signJWT({ uid: row.uid, exp }, env.JWT_SECRET);

  return json({ token, user: { uid: row.uid, name: row.name, email: row.email } });
}
