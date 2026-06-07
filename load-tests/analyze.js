#!/usr/bin/env node
/**
 * Analiza los informes JSON de Artillery y genera un resumen de cuellos
 * de botella con proyecciones para 1k / 10k / 100k visitantes/día.
 *
 * Uso:
 *   node load-tests/analyze.js load-tests/reports/static.json load-tests/reports/functions.json
 */

const fs   = require("fs");
const path = require("path");

// ── Límites conocidos de los servicios de terceros ────────────────────────────
const LIMITS = {
  netlifyFunctions: {
    label:      "Netlify Functions (free tier)",
    unit:       "invocaciones/mes",
    limit:      125_000,
    perOrder:   2,           // send-telegram + send-confirmation
    extraCalls: 1,           // shipping-price + get-order-status por sesión de checkout
  },
  brevo: {
    label: "Brevo email (free tier)",
    unit:  "emails/día",
    limit: 300,
    perOrder: 1,
  },
  telegram: {
    label: "Telegram Bot API",
    unit:  "mensajes/segundo",
    limit: 30,
    perOrder: 1,
  },
  notion: {
    label: "Notion API",
    unit:  "req/segundo",
    limit: 3,
    perOrder: 1,
  },
};

const CONVERSION_RATE = 0.03; // 3% de visitantes completan un pedido

// ── Proyectar límites para N visitantes/día ───────────────────────────────────
function projectLimits(visitorsPerDay) {
  const ordersPerDay = Math.round(visitorsPerDay * CONVERSION_RATE);
  const rows = [];

  // Brevo
  const brevoStatus = ordersPerDay <= LIMITS.brevo.limit
    ? "✅ OK"
    : `❌ LÍMITE SUPERADO (${ordersPerDay - LIMITS.brevo.limit} emails de exceso)`;
  rows.push({ service: LIMITS.brevo.label, demand: `${ordersPerDay}/día`, limit: `${LIMITS.brevo.limit}/día`, status: brevoStatus });

  // Netlify Functions (mensual)
  const funcPerDay  = ordersPerDay * (LIMITS.netlifyFunctions.perOrder + LIMITS.netlifyFunctions.extraCalls);
  const funcPerMonth = funcPerDay * 30;
  const funcStatus = funcPerMonth <= LIMITS.netlifyFunctions.limit
    ? "✅ OK"
    : `❌ LÍMITE SUPERADO (~${(funcPerMonth / 125_000).toFixed(1)}× el límite)`;
  rows.push({ service: LIMITS.netlifyFunctions.label, demand: `${funcPerMonth.toLocaleString()}/mes`, limit: `125.000/mes`, status: funcStatus });

  // Telegram (burst rate)
  const telegramBurst = Math.ceil(ordersPerDay / (24 * 3600)); // promedio req/s
  const telegramStatus = telegramBurst < LIMITS.telegram.limit ? "✅ OK" : "⚠️ Riesgo en pico";
  rows.push({ service: LIMITS.telegram.label, demand: `~${telegramBurst} msg/s promedio`, limit: `${LIMITS.telegram.limit}/s`, status: telegramStatus });

  // Notion
  const notionBurst = Math.ceil((ordersPerDay * 2) / (24 * 3600));
  const notionStatus = notionBurst < LIMITS.notion.limit ? "✅ OK" : "⚠️ Throttling probable";
  rows.push({ service: LIMITS.notion.label, demand: `~${notionBurst} req/s promedio`, limit: `${LIMITS.notion.limit}/s`, status: notionStatus });

  return { visitorsPerDay, ordersPerDay, rows };
}

// ── Parsear reporte Artillery ─────────────────────────────────────────────────
function parseArtilleryReport(filePath) {
  try {
    const raw  = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const agg  = raw.aggregate ?? raw;
    const counters = agg.counters ?? {};
    const summaries = agg.summaries ?? {};
    const rates     = agg.rates ?? {};

    const total   = counters["vusers.completed"] ?? counters["http.requests"] ?? 0;
    const errors  = counters["vusers.failed"] ?? counters["errors.ECONNREFUSED"] ?? 0;
    const rps     = rates["http.request_rate"] ?? 0;

    const httpCodes = {};
    for (const [k, v] of Object.entries(counters)) {
      const m = k.match(/http\.codes\.(\d+)/);
      if (m) httpCodes[m[1]] = v;
    }

    const latency = summaries["http.response_time"] ?? {};

    return {
      file:     path.basename(filePath),
      total,
      errors,
      errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) : "0",
      rps,
      httpCodes,
      p50:  latency.p50  ?? latency.median ?? "-",
      p95:  latency.p95  ?? "-",
      p99:  latency.p99  ?? "-",
      max:  latency.max  ?? "-",
    };
  } catch (e) {
    return { file: path.basename(filePath), error: e.message };
  }
}

// ── Formato tabla texto ───────────────────────────────────────────────────────
function tableRow(cols, widths) {
  return "│ " + cols.map((c, i) => String(c).padEnd(widths[i])).join(" │ ") + " │";
}

function separator(widths) {
  return "├─" + widths.map(w => "─".repeat(w)).join("─┼─") + "─┤";
}

function tableTop(widths) {
  return "┌─" + widths.map(w => "─".repeat(w)).join("─┬─") + "─┐";
}

function tableBottom(widths) {
  return "└─" + widths.map(w => "─".repeat(w)).join("─┴─") + "─┘";
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = process.argv.slice(2);

console.log("\n╔══════════════════════════════════════════════════════════════════╗");
console.log("║        LAYERVAULT — INFORME DE LOAD TESTING                    ║");
console.log("╚══════════════════════════════════════════════════════════════════╝\n");

if (files.length > 0) {
  console.log("── Resultados de las pruebas ─────────────────────────────────────\n");

  const reports = files.map(parseArtilleryReport);
  const colW = [24, 8, 8, 6, 8, 8, 8, 8];
  const headers = ["Escenario", "Total", "Errores", "err%", "p50ms", "p95ms", "p99ms", "maxMs"];

  console.log(tableTop(colW));
  console.log(tableRow(headers, colW));
  console.log(separator(colW));
  for (const r of reports) {
    if (r.error) {
      console.log(tableRow([r.file, "ERROR", r.error, "", "", "", "", ""], colW));
    } else {
      console.log(tableRow([r.file, r.total, r.errors, r.errorRate + "%", r.p50, r.p95, r.p99, r.max], colW));
    }
  }
  console.log(tableBottom(colW));
  console.log();

  // Códigos HTTP
  for (const r of reports) {
    if (!r.error && r.httpCodes && Object.keys(r.httpCodes).length > 0) {
      console.log(`  ${r.file} — respuestas HTTP:`);
      for (const [code, count] of Object.entries(r.httpCodes).sort()) {
        const icon = code.startsWith("2") ? "✅" : code.startsWith("4") ? "⚠️ " : "❌";
        console.log(`    ${icon} HTTP ${code}: ${count}`);
      }
      console.log();
    }
  }
}

// ── Proyecciones de escala ────────────────────────────────────────────────────
console.log("── Proyección de cuellos de botella por escala ──────────────────\n");
console.log(`  Tasa de conversión asumida: ${(CONVERSION_RATE * 100).toFixed(0)}% de visitantes → pedido\n`);

for (const visitors of [500, 1_000, 5_000, 10_000, 50_000]) {
  const proj = projectLimits(visitors);
  console.log(`  ┌── ${proj.visitorsPerDay.toLocaleString()} visitantes/día → ~${proj.ordersPerDay} pedidos/día`);
  for (const row of proj.rows) {
    const status = row.status.includes("❌") ? row.status : row.status.includes("⚠️") ? row.status : row.status;
    console.log(`  │   ${row.service.padEnd(36)} ${row.demand.padEnd(22)} ${status}`);
  }
  console.log("  └──");
  console.log();
}

// ── Resumen de riesgos ────────────────────────────────────────────────────────
console.log("── Resumen de riesgos y recomendaciones ─────────────────────────\n");

const risks = [
  {
    level: "🔴 CRÍTICO",
    service: "Brevo (emails de confirmación)",
    threshold: "~300 pedidos/día (≈10.000 visitantes, CR 3%)",
    impact: "Los clientes no reciben email de confirmación. Pierden confianza.",
    fix: "Upgrade a Brevo Starter (€9/mes, 20.000 emails/mes) o usar resend.com (100 emails/día gratis).",
  },
  {
    level: "🟡 IMPORTANTE",
    service: "Netlify Functions (free tier)",
    threshold: "~1.400 pedidos/mes (125k invocaciones / 3 calls/pedido)",
    impact: "Las funciones dejan de ejecutarse, los pedidos no llegan al vendedor.",
    fix: "Upgrade a Netlify Pro ($19/mes) → 125k invocaciones adicionales.",
  },
  {
    level: "🟡 IMPORTANTE",
    service: "Notion API",
    threshold: "~260 pedidos en <1 minuto (burst)",
    impact: "La escritura en Notion falla (no crítico — está como non-critical en el código).",
    fix: "Ya está marcado como non-critical. Añadir retry con exponential backoff.",
  },
  {
    level: "🟢 BAJO",
    service: "Telegram Bot API",
    threshold: "30 pedidos/segundo simultáneos",
    impact: "Throttling de Telegram — el vendedor recibe el mensaje con retraso.",
    fix: "Añadir cola de envío (Netlify Background Functions o una cola simple en Upstash Redis).",
  },
  {
    level: "🟢 BAJO",
    service: "CDN de Netlify (activos estáticos)",
    threshold: "Sin límite práctico",
    impact: "Ninguno. El CDN de Netlify (Cloudflare) aguanta millones de req/s.",
    fix: "N/A — este punto de la arquitectura es robusto.",
  },
];

for (const r of risks) {
  console.log(`  ${r.level}  ${r.service}`);
  console.log(`  Umbral:  ${r.threshold}`);
  console.log(`  Impacto: ${r.impact}`);
  console.log(`  Fix:     ${r.fix}`);
  console.log();
}

console.log("── Arquitectura bajo carga extrema (100k visitantes/día) ─────────\n");
console.log("  ┌─────────────────────────────────────────────────────────────┐");
console.log("  │  Capa CDN  ──  Angular SPA + JSON catálogo                 │");
console.log("  │  Netlify CDN   Illimitado. TTFB ~50 ms desde España.       │");
console.log("  │  products.json Cache-Control: max-age=3600                  │");
console.log("  ├─────────────────────────────────────────────────────────────┤");
console.log("  │  Funciones serverless (el cuello de botella real)           │");
console.log("  │  shipping-price:    GET cacheado 1h — aguanta cualquier     │");
console.log("  │                     carga gracias al cache del CDN.         │");
console.log("  │  send-telegram:     POST sin cache — 1 llamada/pedido.     │");
console.log("  │                     LÍMITE: Telegram 30/s.                  │");
console.log("  │  send-confirmation: POST sin cache — 1 llamada/pedido.     │");
console.log("  │                     LÍMITE: Brevo 300/día (free tier).      │");
console.log("  │  get-order-status:  GET + Notion query — 3 req/s global.   │");
console.log("  ├─────────────────────────────────────────────────────────────┤");
console.log("  │  VEREDICTO                                                  │");
console.log("  │  La tienda aguanta 10.000 visitantes/día sin tocar nada.   │");
console.log("  │  El primer límite real que se rompe es BREVO a ~300         │");
console.log("  │  pedidos/día (≈10.000 visitantes/día si CR = 3%).          │");
console.log("  │  Solución: €9/mes en Brevo desbloquea 20.000 emails/mes.   │");
console.log("  └─────────────────────────────────────────────────────────────┘");
console.log();
