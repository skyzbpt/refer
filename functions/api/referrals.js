import { json, handleOptions, requireAuth, today } from './_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: '請先登入' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const friend  = (body.friend_name    || '').trim();
  const contact = (body.friend_contact || '').trim();
  const service = (body.service        || '').trim();
  const message = (body.message        || '').trim();
  if (!friend) return json({ error: '請填寫好友姓名' }, 400);

  try {
    await env.DB.prepare(
      'INSERT INTO referrals (user_uid, friend, service, date, contact, message) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(payload.uid, friend, service, today(), contact, message).run();
  } catch (e) {
    // 資料庫尚未加入 contact / message 欄位時的相容寫入
    await env.DB.prepare(
      'INSERT INTO referrals (user_uid, friend, service, date) VALUES (?, ?, ?, ?)'
    ).bind(payload.uid, friend, service, today()).run();
  }

  return json({ ok: true });
}
