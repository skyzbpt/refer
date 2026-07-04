import { json, handleOptions, randomHex, hashPassword, signJWT } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const name     = (body.name     || '').trim();
  const email    = (body.email    || '').trim().toLowerCase();
  const password = (body.password || '');

  if (!name)            return json({ error: '請填寫姓名' }, 400);
  if (!email)           return json({ error: '請填寫 Email' }, 400);
  if (password.length < 6) return json({ error: '密碼至少 6 個字元' }, 400);

  const existing = await env.DB.prepare('SELECT uid FROM users WHERE email = ?').bind(email).first();
  if (existing)  return json({ error: '此 Email 已有帳號，請直接登入' }, 409);

  const uid  = randomHex(16);
  const { hash, salt } = await hashPassword(password);

  await env.DB.prepare(
    'INSERT INTO users (uid, name, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(uid, name, email, hash, salt, Date.now()).run();

  const exp   = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
  const token = await signJWT({ uid, exp }, env.JWT_SECRET);

  return json({ token, user: { uid, name, email } });
}
