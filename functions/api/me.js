import { json, handleOptions, requireAuth } from './_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: '請先登入' }, 401);

  const user = await env.DB.prepare(
    'SELECT uid, name, email FROM users WHERE uid = ?'
  ).bind(payload.uid).first();
  if (!user) return json({ error: '帳號不存在' }, 404);

  const refs = await env.DB.prepare(
    'SELECT friend, service, date FROM referrals WHERE user_uid = ? ORDER BY id ASC'
  ).bind(payload.uid).all();

  const ledger = await env.DB.prepare(
    'SELECT type, amount, note, date FROM ledger WHERE user_uid = ? ORDER BY id ASC'
  ).bind(payload.uid).all();

  return json({
    uid:       user.uid,
    name:      user.name,
    email:     user.email,
    referrals: refs.results,
    ledger:    ledger.results,
  });
}
