import { json, handleOptions, requireAuth, today } from './_lib.js';

export async function onRequestOptions() { return handleOptions(); }

export async function onRequestPost(context) {
  const { request, env } = context;
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: '請先登入' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: '請求格式錯誤' }, 400); }

  const friend  = (body.friend_name    || '').trim();
  const contact = (body.friend_contact || '').trim();
  const service = (body.service        || '').trim();
  const message = (body.message        || '').trim();
  if (!friend) return json({ error: '請填寫好友姓名' }, 400);

  await env.DB.prepare(
    'INSERT INTO referrals (user_uid, friend, service, date) VALUES (?, ?, ?, ?)'
  ).bind(payload.uid, friend, service, today()).run();

  // 通知管理員（需在 Cloudflare 設定 RESEND_API_KEY 機密；未設定時前端會顯示 IG 私訊備援）
  let notified = false;
  if (env.RESEND_API_KEY) {
    const user = await env.DB.prepare(
      'SELECT name, email FROM users WHERE uid = ?'
    ).bind(payload.uid).first();
    context.waitUntil(sendAdminEmail(env, user, { friend, contact, service, message }));
    notified = true;
  }

  return json({ ok: true, notified });
}

async function sendAdminEmail(env, user, r) {
  const sentAt = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  const text = [
    '【合一療癒・轉介紹登記】',
    '介紹人姓名：'   + (user ? user.name  : '未知'),
    '介紹人Email：'  + (user ? user.email : '未知'),
    '好友姓名：'     + r.friend,
    '好友聯絡：'     + (r.contact || '（未填）'),
    '想了解的服務：' + (r.service || '（未選擇）'),
    '備註：'         + (r.message || '（無）'),
    '登記時間：'     + sentAt,
  ].join('\n');

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    env.MAIL_FROM    || '合一療癒轉介紹 <onboarding@resend.dev>',
        to:      [env.ADMIN_EMAIL || 'skyzbpt@gmail.com'],
        subject: '新的轉介紹登記：' + r.friend,
        text,
      }),
    });
  } catch (e) {
    // 寄信失敗不影響已寫入的轉介紹紀錄；後台面板仍看得到資料
  }
}
