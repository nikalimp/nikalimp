// Контент-завод, стек «Next.js + GitHub»: краткая версия новых статей блога в Telegram-канал и в канал Max.
// Оригинал — NikitOS/.claude/toolkit/site-channels/channels.mjs (копия в проекте — scripts/channels.mjs).
//
// Решение Ника (22.10.2026): полная статья живёт только на сайте. В канал идёт её краткое содержание —
// суть, цифры, выводы (telegram.text из спецификации медиа) — и ссылка «Читать полностью на сайте».
// Instant View и копии на telegra.ph не используем: они забирают трафик с сайта.
//
// Сайт, автор — из brand.json проекта (--brand или MEDIA_BRAND).
// Пути (папка статей, спецификации медиа, реестр) — из content.config.json
// (--config, CONTENT_CONFIG или content/factory/content.config.json); без конфига — content/blog, content/media.
// Запускается в GitHub Actions после выкладки сайта. Каналы включаются секретами репозитория:
//   Telegram: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (бот — администратор публичного канала, id или @канал)
//   Max:      MAX_BOT_TOKEN, MAX_CHAT_ID (id канала, бот — администратор)
// Нет секретов — канал выключен: статья отмечается "off" и потом не догоняется (чтобы не было лавины постов).
// Реестр — paths.channels_registry (по умолчанию content/media/channels.json; коммитится обратно в репозиторий).
// Итоги пишутся аннотациями ::notice:: / ::warning:: и в $GITHUB_STEP_SUMMARY — их видно без доступа к логам.
//
//   node scripts/channels.mjs            — опубликовать новые статьи (date за последние 3 дня, ещё нет в реестре)
//   node scripts/channels.mjs <slug> --force — опубликовать/переопубликовать конкретную
//   node scripts/channels.mjs --dry      — показать, что ушло бы (текст поста и ссылку), без отправки
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const bi = argv.indexOf("--brand");
const BRAND_FILE = bi >= 0 ? argv[bi + 1] : process.env.MEDIA_BRAND;
const B = BRAND_FILE && fs.existsSync(BRAND_FILE) ? JSON.parse(fs.readFileSync(BRAND_FILE, "utf8")) : {};
const ci = argv.indexOf("--config");
const CFG_FILE = ci >= 0 ? argv[ci + 1] : process.env.CONTENT_CONFIG || (fs.existsSync("content/factory/content.config.json") ? "content/factory/content.config.json" : "");
const C = CFG_FILE ? JSON.parse(fs.readFileSync(CFG_FILE, "utf8")) : {};
const ROOT = CFG_FILE ? path.resolve(path.dirname(CFG_FILE), C.root || ".") : process.cwd();
const P = C.paths || {};
const dirOf = (tpl, def) => path.join(ROOT, tpl ? path.dirname(tpl) : def);
const SITE = (B.site || C.site || "").replace(/\/$/, "");
if (!SITE) { console.error("channels: нет site в brand.json (--brand) или content.config.json"); process.exit(1); }
const BLOG = (B.blogPath || C.links?.blog_prefix || "/blog/").replace(/^\/?/, "/").replace(/\/?$/, "/");
const BLOG_DIR = dirOf(P.article, "content/blog/x.md");
const MEDIA = dirOf(P.media_spec, "content/media/x.json");
const REG = path.join(ROOT, P.channels_registry || "content/media/channels.json");
// адрес статьи: article.url из конфига ({slug}) или сайт + путь блога
const articleUrl = (slug) => (C.article?.url ? C.article.url.replace("{slug}", slug) : `${SITE}${BLOG}${slug}/`);
const HOST = new URL(SITE).host;
const GH = !!process.env.GITHUB_ACTIONS;
const report = (level, msg) => {
  console.log(GH ? `::${level}::channels: ${msg}` : `  ${level === "warning" ? "!" : "·"} ${msg}`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${level === "warning" ? "⚠️" : "✓"} channels: ${msg}\n`);
};
const args = argv.filter((a, i) => !["--brand", "--config"].includes(a) && !["--brand", "--config"].includes(argv[i - 1]));
const dry = args.includes("--dry");
const force = args.includes("--force");
const only = args.find((a) => !a.startsWith("--"));
const env = process.env;
const TG = env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID;
const MAX = env.MAX_BOT_TOKEN && env.MAX_CHAT_ID;

function parsePost(file) {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return { slug: file.replace(/\.md$/, ""), ...meta };
}

const loadReg = () => (fs.existsSync(REG) ? JSON.parse(fs.readFileSync(REG, "utf8")) : null);
const saveReg = (r) => { fs.mkdirSync(path.dirname(REG), { recursive: true }); fs.writeFileSync(REG, JSON.stringify(r, null, 1) + "\n"); };
const utm = (url, source, slug) => {
  if (!url.startsWith(SITE) || url.includes("utm_")) return url;
  const [base, frag] = url.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}utm_source=${source}&utm_medium=channel&utm_campaign=${slug}${frag ? "#" + frag : ""}`;
};
const abs = (u) => (u.startsWith("/") ? SITE + u : u);
const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function post(url, body, headers = {}) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, j };
}

/** Краткое содержание статьи для канала — telegram.text спецификации; без него — заголовок и description (предупреждение). */
function summary(p) {
  const spec = path.join(MEDIA, `${p.slug}.json`);
  const t = fs.existsSync(spec) ? JSON.parse(fs.readFileSync(spec, "utf8")).telegram?.text : "";
  if (t && t.trim()) return t.trim();
  report("warning", `${p.slug}: нет telegram.text — в канал ушли только заголовок и описание`);
  return `<b>${escHtml(p.title)}</b>\n\n${escHtml(p.description || "")}`;
}

async function sendTelegram(p) {
  const site = utm(articleUrl(p.slug), "telegram", p.slug);
  const text = `${summary(p)}\n\n<a href="${site}">Читать полностью на ${HOST} →</a>`;
  const r = await post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: env.TELEGRAM_CHAT_ID, text: text.slice(0, 4090), parse_mode: "HTML",
    // превью — страница статьи на сайте (обложка из og:image), над текстом
    link_preview_options: { url: site, prefer_large_media: true, show_above_text: true },
    reply_markup: { inline_keyboard: [[{ text: "Читать полностью на сайте", url: site }]] },
  });
  if (!r.j.ok) throw new Error("Telegram: " + JSON.stringify(r.j));
  const chat = r.j.result.chat;
  return chat.username ? `https://t.me/${chat.username}/${r.j.result.message_id}` : String(r.j.result.message_id);
}

async function sendMax(p) {
  const site = utm(articleUrl(p.slug), "max", p.slug);
  const attachments = [];
  if (p.cover) attachments.push({ type: "image", payload: { url: abs(p.cover) } });
  attachments.push({ type: "inline_keyboard", payload: { buttons: [[{ type: "link", text: "Читать полностью на сайте", url: site }]] } });
  const text = `${summary(p)}\n\n<a href="${site}">Читать полностью на ${HOST} →</a>`.slice(0, 3990);
  const r = await post(`https://platform-api2.max.ru/messages?chat_id=${env.MAX_CHAT_ID}`, { text, format: "html", attachments, notify: true },
    { Authorization: env.MAX_BOT_TOKEN });
  if (!r.ok || r.j.code) throw new Error("Max: " + JSON.stringify(r.j));
  return r.j.message?.url || r.j.message?.body?.mid || "ok";
}

async function main() {
  const posts = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md")).map(parsePost);
  let reg = loadReg();
  if (!reg) { // первый запуск: всё, что уже есть, не публикуем
    reg = { posts: Object.fromEntries(posts.map((p) => [p.slug, { tg: "skip", max: "skip" }])) };
    saveReg(reg); console.log(`channels: реестр создан, ${posts.length} старых статей пропущено`);
    if (!only) return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  console.log(`channels: Telegram ${TG ? "вкл" : "выкл"}, Max ${MAX ? "вкл" : "выкл"}, реестр ${path.relative(ROOT, REG)}`);
  if (!TG) report("notice", "Telegram выключен — нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID");
  for (const p of posts) {
    if (only && p.slug !== only) continue;
    if (!only && (p.date > today || p.date < since)) continue;
    if (p.channels === "no") continue;
    const r = (reg.posts[p.slug] ||= {});
    const want = (k) => force || !r[k] || r[k] === "error";
    if (dry) {
      console.log(`\n— ${p.slug}: tg=${r.tg ?? "—"} max=${r.max ?? "—"}\n${summary(p)}\n\nЧитать полностью на ${HOST} → ${utm(articleUrl(p.slug), "telegram", p.slug)}`);
      continue;
    }
    if (want("tg")) {
      if (!TG) r.tg = "off";
      else try { r.tg = await sendTelegram(p); report("notice", `Telegram ${p.slug} → ${r.tg}`); }
      catch (e) { r.tg = "error"; r.tg_error = e.message.slice(0, 300); report("warning", `Telegram ${p.slug}: ${e.message.slice(0, 200)}`); }
    }
    if (want("max")) {
      if (!MAX) r.max = "off";
      else try { r.max = await sendMax(p); report("notice", `Max ${p.slug} → ${r.max}`); }
      catch (e) { r.max = "error"; r.max_error = e.message.slice(0, 300); report("warning", `Max ${p.slug}: ${e.message.slice(0, 200)}`); }
    }
    saveReg(reg);
    report("notice", `реестр сохранён: ${path.relative(ROOT, REG)}`);
  }
}

main().catch((e) => { report("warning", `упал: ${e.message}`); process.exit(1); });
