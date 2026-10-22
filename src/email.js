// Известия по имейл за нови регистрации и съобщения, през REST API на ZeptoMail (като в
// bulgaria-property-concierge). Ако ZEPTOMAIL_TOKEN / NOTIFY_TO / NOTIFY_FROM липсват, нищо не се
// праща, но записът в базата и админ панела работят както обикновено.
const ZEPTOMAIL_API = 'https://api.zeptomail.eu/v1.1/email';

async function sendNotification({ subject, lines, replyTo }) {
  const token = process.env.ZEPTOMAIL_TOKEN;
  const to = process.env.NOTIFY_TO;
  const from = process.env.NOTIFY_FROM;
  if (!token || !to || !from) return { sent: false, reason: 'not_configured' };

  try {
    const res = await fetch(ZEPTOMAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Zoho-enczapikey ${token}` },
      body: JSON.stringify({
        from: { address: from, name: 'Библията под лупа' },
        to: [{ email_address: { address: to } }],
        ...(replyTo ? { reply_to: [{ address: replyTo.address, name: replyTo.name }] } : {}),
        subject,
        textbody: lines.filter((l) => l !== null && l !== undefined).join('\n'),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`ZeptoMail ${res.status}: ${body.slice(0, 300)}`);
    }
    return { sent: true };
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
}

const HELP_LABELS = {
  greet: 'Посрещане',
  food: 'Почерпка',
  tech: 'Звук и техника',
  video: 'Снимки и видео',
  social: 'Социални мрежи',
  setup: 'Подреждане на залата',
};

function notifyRegistration(r, episode) {
  return sendNotification({
    subject: `Нова регистрация: ${r.name} (епизод ${episode.id})`,
    lines: [
      `${r.name} се записа за епизод ${episode.id} (${episode.date}): ${episode.question}`,
      '',
      `Телефон: ${r.phone || '-'}`,
      `Имейл: ${r.email || '-'}`,
      `Покана от: ${r.invitedBy || '-'}`,
      `За първи път: ${r.firstTime ? 'да' : 'не'}`,
      `Иска да помага: ${r.help.length ? r.help.map((h) => HELP_LABELS[h] || h).join(', ') : 'не'}`,
    ],
    replyTo: r.email ? { address: r.email, name: r.name } : null,
  });
}

function notifyContact(c) {
  return sendNotification({
    subject: `Ново съобщение от ${c.name}`,
    lines: [`От: ${c.name} <${c.email}>`, '', c.message],
    replyTo: { address: c.email, name: c.name },
  });
}

module.exports = { notifyRegistration, notifyContact };
