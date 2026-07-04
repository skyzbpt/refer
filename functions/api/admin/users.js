import { json, handleOptions } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestGet({ request, env }) {
  const pw = request.headers.get('X-Admin-Password') || '';

  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) {
    return json({ error: '密碼不正確' }, 403);
  }

  const users = await env.DB.prepare(
    'SELECT uid, name, email FROM users ORDER BY created_at ASC'
  ).all();

  const result = await Promise.all(users.results.map(async (u) => {
    let refs;
    try {
      refs = await env.DB.prepare(
        'SELECT friend, service, date, contact, message FROM referrals WHERE user_uid = ? ORDER BY id ASC'
      ).bind(u.uid).all();
    } catch (e) {
      // 資料庫尚未加入 contact / message 欄位時的相容查詢
      refs = await env.DB.prepare(
        'SELECT friend, service, date FROM referrals WHERE user_uid = ? ORDER BY id ASC'
      ).bind(u.uid).all();
    }

    const ledger = await env.DB.prepare(
      'SELECT type, amount, note, date FROM ledger WHERE user_uid = ? ORDER BY id ASC'
    ).bind(u.uid).all();

    return { uid: u.uid, name: u.name, email: u.email, referrals: refs.results, ledger: ledger.results };
  }));

  return json({ users: result });
}
