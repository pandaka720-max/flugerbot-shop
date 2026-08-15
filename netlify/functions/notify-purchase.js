exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const order = JSON.parse(event.body || '{}');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Telegram settings are not configured' })
      };
    }

    if (!order.username || !order.type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing order data' })
      };
    }

    const lines = [
      '🛒 <b>Новая заявка на покупку</b>',
      '',
      `📦 Товар: <b>${escapeHtml(order.type)}</b>`,
      order.quantity ? `⭐ Количество: <b>${escapeHtml(order.quantity)}</b>` : null,
      order.period ? `💎 Период: <b>${escapeHtml(order.period)}</b>` : null,
      order.rub ? `💰 Сумма: <b>${escapeHtml(order.rub)}</b>` : null,
      order.usd ? `💵 USD: <b>${escapeHtml(order.usd)}</b>` : null,
      `💳 Способ оплаты: <b>${escapeHtml(order.paymentMethod || 'Не указан')}</b>`,
      `👤 Username: <b>${escapeHtml(order.username)}</b>`,
      `🕐 Время: <b>${escapeHtml(order.createdAt || new Date().toLocaleString('ru-RU'))}</b>`
    ].filter(Boolean);

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML'
      })
    });

    const result = await telegramResponse.json();

    if (!telegramResponse.ok || !result.ok) {
      console.error('Telegram API error:', result);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Telegram message was not sent' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
