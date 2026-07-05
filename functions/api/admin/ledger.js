import { json, handleOptions } from '../_lib.js';

export async function onRequestOptions() { return handleOptions(); }

/* 刪除一筆點數異動紀錄（餘額會隨之重算）：DELETE /api/admin/ledger?id=123 */
export async function onRequestDelete({ request, env }) {
  const pw = request.headers.get('X-Admin-Password') || '';
  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) {
    return json({ error: '密碼不正確' }, 403);
  }

  const id = parseInt(new URL(request.url).searchParams.get('id'), 10);
  if (!id || id <= 0) return json({ error: '缺少紀錄編號' }, 400);

  await env.DB.prepare('DELETE FROM ledger WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
