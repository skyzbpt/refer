import { json, handleOptions } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pw  = url.searchParams.get('password') || '';

  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) {
    return json({ error: '密碼不正確' }, 403);
  }

  const users = await env.DB.prepare(
    'SELECT uid, name, email FROM users ORDER BY created_at ASC'
  ).all();

  const result = await Promise.all(users.results.map(async (u) => {
    const refs = await env.DB.prepare(
      'SELECT friend, service, date FROM referrals WHERE user_uid = ? ORDER BY id ASC'
    ).bind(u.uid).all();

    const ledger = await env.DB.prepare(
      'SELECT type, amount, note, date FROM ledger WHERE user_uid = ? ORDER BY id ASC'
    ).bind(u.uid).all();

    return { uid: u.uid, name: u.name, email: u.email, referrals: refs.results, ledger: ledger.results };
  }));

  return json({ users: result });
}
