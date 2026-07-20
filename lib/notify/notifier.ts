import 'server-only';

// Alerting-laag (C5). Interface met twee implementaties: console (dev) en e-mail via Resend.
// Zolang RESEND_API_KEY leeg is (mailings gaan via het ticketdashboard) valt alles op console.

export type AlertType =
  'sync_failed' | 'high_unmatched' | 'new_quarantine' | 'margin_drop' | 'stale';

export interface Alert {
  type: AlertType;
  message: string;
}

export interface Notifier {
  send(alerts: Alert[]): Promise<void>;
}

export class ConsoleNotifier implements Notifier {
  async send(alerts: Alert[]): Promise<void> {
    for (const a of alerts) console.warn(`[ALERT:${a.type}] ${a.message}`);
  }
}

export class ResendNotifier implements Notifier {
  constructor(
    private apiKey: string,
    private to: string[],
    private from = 'PriceScan <alerts@hellotv.local>',
  ) {}

  async send(alerts: Alert[]): Promise<void> {
    if (alerts.length === 0) return;
    const body = alerts.map((a) => `• [${a.type}] ${a.message}`).join('\n');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.from,
        to: this.to,
        subject: `helloTV PriceScan — ${alerts.length} alert(s)`,
        text: body,
      }),
    });
  }
}

/** Kies de notifier op basis van env. Standaard console; Resend als er een key + adressen zijn. */
export function getNotifier(): Notifier {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.ALERT_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (key && to.length > 0) return new ResendNotifier(key, to);
  return new ConsoleNotifier();
}
