import { json, handleOptions } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

function checkPw(request, env) {
  const pw = request.headers.get('X-Admin-Password') || '';
  return !!env.ADMIN_PASSWORD && pw === env.ADMIN_PASSWORD;
}

/* 刪除一筆推薦紀錄：DELETE /api/admin/referral?id=123 */
export async function onRequestDelete({ request, env }) {
  if (!checkPw(request, env)) return json({ error: '密碼不正確' }, 403);

  const id = parseInt(new URL(request.url).searchParams.get('id'), 10);
  if (!id || id <= 0) return json({ error: '缺少紀錄編號' }, 400);

  await env.DB.prepare('DELETE FROM referrals WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

/* 編輯一筆推薦紀錄：PUT /api/admin/referral */
export async function onRequestPut({ request, env }) {
  if (!checkPw(request, env)) return json({ error: '密碼不正確' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const id      = parseInt(body.id, 10);
  const friend  = (body.friend  || '').trim();
  const contact = (body.contact || '').trim();
  const service = (body.service || '').trim();
  const message = (body.message || '').trim();

  if (!id || id <= 0) return json({ error: '缺少紀錄編號' }, 400);
  if (!friend)        return json({ error: '請填寫好友姓名' }, 400);

  await env.DB.prepare(
    'UPDATE referrals SET friend = ?, contact = ?, service = ?, message = ? WHERE id = ?'
  ).bind(friend, contact, service, message, id).run();

  return json({ ok: true });
}
