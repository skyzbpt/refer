import { json, handleOptions, today } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const pw     = (body.password || '');
  const uid    = (body.uid      || '');
  const type   = (body.type     || '');
  const amount = parseInt(body.amount, 10);
  const note   = (body.note     || '').trim();

  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) return json({ error: '密碼不正確' }, 403);
  if (!uid)                  return json({ error: '缺少會員 uid' }, 400);
  if (type !== 'grant' && type !== 'redeem') return json({ error: 'type 必須為 grant 或 redeem' }, 400);
  if (!amount || amount <= 0) return json({ error: '請輸入正確的點數' }, 400);

  if (type === 'redeem') {
    const ledger = await env.DB.prepare(
      'SELECT type, amount FROM ledger WHERE user_uid = ?'
    ).bind(uid).all();
    let bal = 0;
    for (const row of ledger.results) {
      bal += row.type === 'grant' ? row.amount : -row.amount;
    }
    if (bal < amount) return json({ error: '點數不足' }, 400);
  }

  await env.DB.prepare(
    'INSERT INTO ledger (user_uid, type, amount, note, date) VALUES (?, ?, ?, ?, ?)'
  ).bind(uid, type, amount, note, today()).run();

  return json({ ok: true });
}
