import { json, handleOptions, requireAuth, today } from './_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: '請先登入' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const friend  = (body.friend_name || '').trim();
  const service = (body.service     || '').trim();
  if (!friend) return json({ error: '請填寫好友姓名' }, 400);

  await env.DB.prepare(
    'INSERT INTO referrals (user_uid, friend, service, date) VALUES (?, ?, ?, ?)'
  ).bind(payload.uid, friend, service, today()).run();

  return json({ ok: true });
}
