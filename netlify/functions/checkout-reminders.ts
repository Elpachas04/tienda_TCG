import type { Config } from "@netlify/functions";
import { Draft, REMINDER_POLICY, draftKey, draftsStore, reminderHtml, sendBrevoEmail, sentKey, signedRef } from "./_checkout-drafts";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Cada hora: manda el recordatorio a las cestas que llevan REMINDER_POLICY.remindAfterHours sin pedirse
// y borra las que ya no sirven. Las reglas de tiempo están en _checkout-drafts.ts.
export default async (): Promise<void> => {
  const store = draftsStore();
  const now = Date.now();
  let sent = 0, removed = 0;

  const { blobs } = await store.list({ prefix: "draft/" });
  for (const { key } of blobs) {
    const hash = key.slice("draft/".length);
    try {
      const draft = await store.get(key, { type: "json" }) as Draft | null;
      if (!draft) continue;
      const age = now - Date.parse(draft.updatedAt);

      if (age > REMINDER_POLICY.keepDays * DAY) {
        await store.delete(key);
        removed++;
        continue;
      }
      if (draft.remindedAt) continue; // ya avisado: el borrador queda para que el enlace del email funcione
      if (age < REMINDER_POLICY.remindAfterHours * HOUR || age > REMINDER_POLICY.remindUntilHours * HOUR) continue;

      const last = await store.get(sentKey(hash), { type: "json" }) as { at: string } | null;
      if (last && now - Date.parse(last.at) < REMINDER_POLICY.cooldownDays * DAY) {
        await store.delete(key);
        removed++;
        continue;
      }

      const ok = await sendBrevoEmail(draft.email, "Tu cesta de LayerVault sigue guardada", reminderHtml(draft, signedRef(hash)));
      if (!ok) continue; // se reintenta en la próxima pasada
      const at = new Date(now).toISOString();
      await store.setJSON(sentKey(hash), { at });
      await store.setJSON(key, { ...draft, remindedAt: at });
      sent++;
    } catch (err) {
      console.error(`checkout-reminders ${draftKey(hash)}:`, err);
    }
  }

  // Las marcas de "ya recordado" solo hacen falta durante el periodo de espera
  const marks = await store.list({ prefix: "sent/" });
  for (const { key } of marks.blobs) {
    const mark = await store.get(key, { type: "json" }).catch(() => null) as { at: string } | null;
    if (!mark || now - Date.parse(mark.at) > REMINDER_POLICY.cooldownDays * DAY) await store.delete(key);
  }

  console.log(`checkout-reminders: ${sent} recordatorios, ${removed} cestas borradas`);
};

export const config: Config = { schedule: "@hourly" };
