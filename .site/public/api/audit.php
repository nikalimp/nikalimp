<?php
@ini_set('display_errors', '0'); // предупреждения PHP не должны ломать JSON-ответ
// Сбор фактов о сайте для бесплатных инструментов /site-audit/ и /seo-audit/.
// Сервер только скачивает страницу и служебные файлы и отдаёт факты; оценку и советы считает браузер (src/lib/audit.ts),
// поэтому правила проверки меняются без правки этого файла.
//
// Совместимо с PHP 5.4+: без ??, без типов. Данные — ВНЕ папки сайта (rsync --delete при выкладке их не трогает):
//   /var/www/u3672757/data/audit/limits.json — сколько проверок сделал каждый IP за час (создаётся сам)
//   /var/www/u3672757/data/audit/cache/      — кэш ответов на 30 минут
//
// POST {"url":"example.ru"} → {"ok":true,"facts":{…}} | {"error":"…"}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

define('UA', 'Mozilla/5.0 (compatible; NikAlimpAudit/1.0; +https://nikalimp.ru/site-audit/)');
define('MAX_BYTES', 3 * 1024 * 1024);
define('PER_HOUR', 30);

function v(&$x, $d = null) { return isset($x) ? $x : $d; }
function out($code, $data) {
  http_response_code($code);
  echo json_encode($data, defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES : 0);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') out(200, array('enabled' => function_exists('curl_init') && class_exists('DOMDocument')));
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, array('error' => 'Метод не поддерживается'));
$origin = v($_SERVER['HTTP_ORIGIN'], '');
if ($origin && !preg_match('~^https?://(www\.)?nikalimp\.ru$|^http://localhost(:\d+)?$~', $origin)) out(403, array('error' => 'Запрещено'));

$DIR = dirname(dirname(dirname(__DIR__))) . '/audit';
@mkdir($DIR . '/cache', 0700, true);

// --- Адрес -------------------------------------------------------------------------------------------
$in = json_decode(file_get_contents('php://input'), true);
$raw = trim((string)v($in['url'], ''));
if ($raw === '' || strlen($raw) > 500) out(400, array('error' => 'Укажите адрес сайта'));
if (!preg_match('~^https?://~i', $raw)) $raw = 'https://' . $raw;
$p = parse_url($raw);
if (!$p || empty($p['host'])) out(400, array('error' => 'Не получилось разобрать адрес'));
$host = strtolower($p['host']);
if (function_exists('idn_to_ascii') && preg_match('/[^\x20-\x7e]/', $host)) {
  $a = defined('INTL_IDNA_VARIANT_UTS46') ? @idn_to_ascii($host, 0, INTL_IDNA_VARIANT_UTS46) : @idn_to_ascii($host);
  if ($a) $host = $a;
}
if (!preg_match('/^[a-z0-9.-]+\.[a-z0-9-]{2,}$/', $host)) out(400, array('error' => 'Похоже, в адресе ошибка'));
$path = isset($p['path']) && $p['path'] !== '' ? $p['path'] : '/';
$query = isset($p['query']) ? '?' . $p['query'] : '';
$start = strtolower($p['scheme']) . '://' . $host . $path . $query;

// --- Лимит: 30 проверок в час с одного IP -------------------------------------------------------------
$ip = v($_SERVER['REMOTE_ADDR'], '0');
$cacheFile = $DIR . '/cache/' . md5($start) . '.json';
if (is_file($cacheFile) && filemtime($cacheFile) > time() - 1800) { echo file_get_contents($cacheFile); exit; }
$fp = fopen($DIR . '/limits.json', 'c+');
if ($fp) {
  flock($fp, LOCK_EX);
  $lim = json_decode(stream_get_contents($fp), true);
  if (!is_array($lim)) $lim = array();
  $hour = date('YmdH');
  foreach ($lim as $k => $x) if (v($x['h']) !== $hour) unset($lim[$k]);
  $n = (int)v($lim[$ip]['n'], 0);
  if ($n >= PER_HOUR) { flock($fp, LOCK_UN); out(429, array('error' => 'Слишком много проверок с вашего адреса. Попробуйте через час.')); }
  $lim[$ip] = array('h' => $hour, 'n' => $n + 1);
  ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($lim)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
}

// --- Безопасность: только публичные адреса (защита от запросов во внутреннюю сеть) --------------------
function public_ip($host) {
  if (getenv('AUDIT_TEST') === '1') return 'test'; // локальная проверка за прокси: DNS недоступен
  $ips = @gethostbynamel($host);
  if (!$ips) return false;
  foreach ($ips as $ip) if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return false;
  return $ips[0];
}

/** Один запрос без автоматических редиректов: статус, заголовки, тело (до MAX_BYTES), время. */
function fetch($url, $method = 'GET', $maxBytes = MAX_BYTES, $ua = UA) {
  $p = parse_url($url);
  if (!$p || empty($p['host']) || !in_array(strtolower(v($p['scheme'], '')), array('http', 'https'))) return array('error' => 'bad-url');
  $port = isset($p['port']) ? (int)$p['port'] : (strtolower($p['scheme']) === 'https' ? 443 : 80);
  if (!in_array($port, array(80, 443))) return array('error' => 'port');
  $ip = public_ip($p['host']);
  if (!$ip) return array('error' => 'dns');
  $headers = array(); $body = ''; $cut = false;
  $ch = curl_init($url);
  $opts = array(
    CURLOPT_CUSTOMREQUEST => $method, CURLOPT_NOBODY => $method === 'HEAD', CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_TIMEOUT => 12, CURLOPT_USERAGENT => $ua, CURLOPT_ENCODING => '',
    CURLOPT_HTTPHEADER => array('Accept: text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language: ru,en;q=0.8'),
    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_RETURNTRANSFER => false,
    CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$headers) {
      $i = strpos($line, ':');
      if ($i !== false) $headers[strtolower(trim(substr($line, 0, $i)))] = trim(substr($line, $i + 1));
      return strlen($line);
    },
    CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$body, &$cut, $maxBytes) {
      $body .= $chunk;
      if (strlen($body) > $maxBytes) { $cut = true; return 0; }
      return strlen($chunk);
    },
  );
  if (defined('CURLOPT_RESOLVE') && $ip !== 'test') $opts[CURLOPT_RESOLVE] = array($p['host'] . ':' . $port . ':' . $ip); // без повторного DNS — нельзя подменить адрес между проверкой и запросом
  curl_setopt_array($ch, $opts);
  curl_exec($ch);
  $err = curl_errno($ch) && !$cut ? curl_error($ch) : '';
  $r = array(
    'status' => (int)curl_getinfo($ch, CURLINFO_HTTP_CODE), 'headers' => $headers, 'body' => $body, 'cut' => $cut,
    'ttfb' => round(curl_getinfo($ch, CURLINFO_STARTTRANSFER_TIME) * 1000), 'time' => round(curl_getinfo($ch, CURLINFO_TOTAL_TIME) * 1000),
    'ip' => $ip, 'ssl' => strtolower($p['scheme']) === 'https' ? (curl_getinfo($ch, CURLINFO_SSL_VERIFYRESULT) === 0) : null,
  );
  if (PHP_VERSION_ID < 80000) curl_close($ch);
  if ($err) $r['error'] = $err;
  return $r;
}

/** Цепочка редиректов (до 6 шагов) */
function follow($url) {
  $chain = array();
  for ($i = 0; $i < 6; $i++) {
    $r = fetch($url);
    $chain[] = array('url' => $url, 'status' => $r['status'], 'error' => v($r['error']));
    if (!empty($r['error']) || $r['status'] < 300 || $r['status'] >= 400 || empty($r['headers']['location'])) return array($r, $chain, $url);
    $loc = $r['headers']['location'];
    if (!preg_match('~^https?://~i', $loc)) {
      $p = parse_url($url);
      $loc = $p['scheme'] . '://' . $p['host'] . ($loc[0] === '/' ? $loc : '/' . $loc);
    }
    $url = $loc;
  }
  return array($r, $chain, $url);
}

list($page, $chain, $final) = follow($start);
if (!empty($page['error'])) {
  $msg = $page['error'] === 'dns' ? 'Домен не найден или ведёт во внутреннюю сеть' : 'Сайт не ответил: ' . $page['error'];
  out(200, array('ok' => false, 'error' => $msg, 'chain' => $chain));
}
$fp_ = parse_url($final);
$base = $fp_['scheme'] . '://' . $fp_['host'];

// --- Разбор HTML -----------------------------------------------------------------------------------------
$html = $page['body'];
$ct = strtolower(v($page['headers']['content-type'], ''));
$facts = array(
  'url' => $start, 'final' => $final, 'chain' => $chain, 'status' => $page['status'], 'ttfb' => $page['ttfb'], 'time' => $page['time'],
  'bytes' => strlen($html), 'cut' => $page['cut'], 'ssl' => $page['ssl'], 'contentType' => $ct,
  'headers' => array_intersect_key($page['headers'], array_flip(array('server', 'content-encoding', 'cache-control', 'strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'x-robots-tag', 'last-modified', 'content-language', 'x-powered-by'))),
);

$h = array('title' => null, 'description' => null, 'robots' => null, 'canonical' => null, 'lang' => null, 'viewport' => null, 'charset' => null,
  'headings' => array(), 'og' => array(), 'twitter' => array(), 'jsonld' => array(), 'hreflang' => array(), 'images' => 0, 'imagesNoAlt' => 0, 'imagesNoAltSrc' => array(),
  'imagesLazy' => 0, 'imagesNoSize' => 0, 'links' => 0, 'internal' => 0, 'external' => 0, 'nofollow' => 0, 'emptyLinks' => 0, 'words' => 0, 'text' => '',
  'scripts' => 0, 'scriptsExternal' => 0, 'styles' => 0, 'iframes' => 0, 'forms' => 0, 'favicon' => false, 'manifest' => false, 'appleIcon' => false,
  'verification' => array(), 'analytics' => array(), 'generator' => null, 'microdata' => false, 'textRatio' => 0, 'inlineStylesBytes' => 0, 'deprecated' => 0,
  'lists' => 0, 'tables' => 0, 'tel' => 0, 'mailto' => 0, 'times' => 0, 'metaAuthor' => null, 'sameAs' => 0, 'author' => false, 'dates' => false, 'lead' => null, 'leadWords' => 0);

if ($html !== '' && strpos($ct, 'html') !== false) {
  libxml_use_internal_errors(true);
  $doc = new DOMDocument();
  $doc->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOWARNING | LIBXML_NOERROR);
  $xp = new DOMXPath($doc);
  $one = function ($q) use ($xp) { $n = $xp->query($q); return $n && $n->length ? trim($n->item(0)->nodeValue) : null; };
  $h['title'] = $one('//title');
  $h['description'] = $one('//meta[translate(@name,"DESCRIPTION","description")="description"]/@content');
  $h['robots'] = $one('//meta[translate(@name,"ROBOTS","robots")="robots"]/@content');
  $h['canonical'] = $one('//link[translate(@rel,"CANONICAL","canonical")="canonical"]/@href');
  $h['lang'] = $one('//html/@lang');
  $h['viewport'] = $one('//meta[@name="viewport"]/@content');
  $h['charset'] = $one('//meta/@charset') ?: (stripos($ct, 'charset=') !== false ? substr($ct, stripos($ct, 'charset=') + 8) : null);
  $h['generator'] = $one('//meta[@name="generator"]/@content');
  foreach ($xp->query('//h1|//h2|//h3|//h4|//h5|//h6') as $n) {
    if (count($h['headings']) >= 120) break;
    $h['headings'][] = array((int)substr($n->nodeName, 1), mb_substr(trim(preg_replace('/\s+/u', ' ', $n->textContent)), 0, 160));
  }
  foreach ($xp->query('//meta[starts-with(@property,"og:")]') as $n) $h['og'][$n->getAttribute('property')] = mb_substr($n->getAttribute('content'), 0, 300);
  foreach ($xp->query('//meta[starts-with(@name,"twitter:")]') as $n) $h['twitter'][$n->getAttribute('name')] = mb_substr($n->getAttribute('content'), 0, 300);
  foreach ($xp->query('//script[@type="application/ld+json"]') as $n) {
    $j = json_decode(trim($n->textContent), true);
    if ($j === null) { $h['jsonld'][] = '!ошибка JSON'; continue; }
    $stack = array($j);
    while ($stack) {
      $x = array_pop($stack);
      if (!is_array($x)) continue;
      if (isset($x['@type'])) foreach ((array)$x['@type'] as $t) $h['jsonld'][] = (string)$t;
      if (isset($x['sameAs'])) $h['sameAs'] += count((array)$x['sameAs']);
      if (isset($x['author'])) $h['author'] = true;
      if (isset($x['datePublished']) || isset($x['dateModified'])) $h['dates'] = true;
      foreach ($x as $k => $y) if (is_array($y)) $stack[] = $y;
    }
  }
  $h['jsonld'] = array_values(array_unique($h['jsonld']));
  foreach ($xp->query('//link[@hreflang]') as $n) $h['hreflang'][] = $n->getAttribute('hreflang');
  foreach ($xp->query('//img') as $n) {
    $h['images']++;
    if (!$n->hasAttribute('alt')) { $h['imagesNoAlt']++; if (count($h['imagesNoAltSrc']) < 8) $h['imagesNoAltSrc'][] = mb_substr($n->getAttribute('src') ?: $n->getAttribute('data-src'), 0, 160); }
    if ($n->getAttribute('loading') === 'lazy') $h['imagesLazy']++;
    if (!$n->hasAttribute('width') || !$n->hasAttribute('height')) $h['imagesNoSize']++;
  }
  foreach ($xp->query('//a[@href]') as $n) {
    $href = trim($n->getAttribute('href'));
    if ($href === '' || $href[0] === '#' || preg_match('~^(mailto|tel|javascript):~i', $href)) continue;
    $h['links']++;
    $u = parse_url($href);
    $ext = isset($u['host']) && strtolower(preg_replace('/^www\./', '', $u['host'])) !== strtolower(preg_replace('/^www\./', '', $fp_['host']));
    if ($ext) $h['external']++; else $h['internal']++;
    if (stripos($n->getAttribute('rel'), 'nofollow') !== false) $h['nofollow']++;
    if (trim($n->textContent) === '' && !$xp->query('.//img[@alt!=""]|.//*[@aria-label]', $n)->length && !$n->getAttribute('aria-label')) $h['emptyLinks']++;
  }
  $h['scripts'] = $xp->query('//script')->length;
  $h['scriptsExternal'] = $xp->query('//script[@src]')->length;
  $h['styles'] = $xp->query('//link[@rel="stylesheet"]')->length;
  foreach ($xp->query('//style') as $n) $h['inlineStylesBytes'] += strlen($n->textContent);
  $h['iframes'] = $xp->query('//iframe')->length;
  $h['forms'] = $xp->query('//form')->length;
  $h['lists'] = $xp->query('//body//ul[count(li)>=3]|//body//ol[count(li)>=3]')->length;
  $h['tables'] = $xp->query('//body//table')->length;
  $h['tel'] = $xp->query('//a[starts-with(@href,"tel:")]')->length;
  $h['mailto'] = $xp->query('//a[starts-with(@href,"mailto:")]')->length;
  $h['times'] = $xp->query('//time[@datetime]')->length;
  $h['metaAuthor'] = $one('//meta[@name="author"]/@content');
  // Первый абзац с мыслью — кандидат в «прямой ответ», который цитируют нейросети
  $h['lead'] = null; $h['leadWords'] = 0;
  foreach ($xp->query('//body//p') as $n) {
    $t = trim(preg_replace('/\s+/u', ' ', $n->textContent));
    $w = preg_match_all('/[\p{L}\p{N}]{2,}/u', $t, $mm);
    if ($w >= 12) { $h['lead'] = mb_substr($t, 0, 400); $h['leadWords'] = $w; break; }
  }
  $h['favicon'] = $xp->query('//link[contains(translate(@rel,"ICON","icon"),"icon")]')->length > 0;
  $h['manifest'] = $xp->query('//link[@rel="manifest"]')->length > 0;
  $h['appleIcon'] = $xp->query('//link[@rel="apple-touch-icon"]')->length > 0;
  $h['microdata'] = $xp->query('//*[@itemscope]')->length > 0;
  $h['deprecated'] = $xp->query('//font|//center|//marquee|//frameset')->length;
  foreach (array('yandex-verification', 'google-site-verification') as $m) if ($xp->query('//meta[@name="' . $m . '"]')->length) $h['verification'][] = $m;
  if (preg_match('~mc\.yandex\.ru/metrika|ym\(\d+~', $html)) $h['analytics'][] = 'Яндекс Метрика';
  if (preg_match('~googletagmanager\.com/gtag|google-analytics\.com|gtag\(~', $html)) $h['analytics'][] = 'Google Analytics';
  if (preg_match('~googletagmanager\.com/gtm\.js~', $html)) $h['analytics'][] = 'Google Tag Manager';
  if (preg_match('~top-fwz1\.mail\.ru|vk\.com/rtrg~', $html)) $h['analytics'][] = 'Пиксель VK';
  foreach ($xp->query('//script|//style|//noscript|//svg') as $n) $n->parentNode->removeChild($n);
  $body = $xp->query('//body');
  $text = $body->length ? trim(preg_replace('/\s+/u', ' ', $body->item(0)->textContent)) : '';
  $h['words'] = preg_match_all('/[\p{L}\p{N}]{2,}/u', $text, $mm);
  $h['text'] = mb_substr($text, 0, 600);
  $h['textRatio'] = strlen($html) ? round(strlen($text) / strlen($html) * 100) : 0;
  // Сигналы конструкторов: если страница собирается скриптами, текста в HTML мало
  if (!$h['generator']) {
    if (stripos($html, 'tildacdn.com') !== false) $h['generator'] = 'Tilda';
    elseif (stripos($html, 'website-files.com') !== false || stripos($html, 'data-wf-page') !== false) $h['generator'] = 'Webflow';
    elseif (stripos($html, '/wp-content/') !== false || stripos($html, '/wp-includes/') !== false) $h['generator'] = 'WordPress';
    elseif (stripos($html, '/bitrix/js/') !== false || stripos($html, '/bitrix/templates/') !== false) $h['generator'] = '1С-Битрикс';
    elseif (stripos($html, '/_next/static/') !== false) $h['generator'] = 'Next.js';
    elseif (stripos($html, 'static.wixstatic.com') !== false) $h['generator'] = 'Wix';
    elseif (stripos($html, 'cdn.shopify.com') !== false) $h['generator'] = 'Shopify';
  }
}
$facts['html'] = $h;

// --- Служебные файлы и варианты адреса ------------------------------------------------------------------
$robots = fetch($base . '/robots.txt', 'GET', 300000);
$facts['robots'] = array('status' => $robots['status'], 'text' => $robots['status'] === 200 && stripos(v($robots['headers']['content-type'], 'text'), 'html') === false ? mb_substr($robots['body'], 0, 20000) : null);
$sitemapUrl = $base . '/sitemap.xml';
if ($facts['robots']['text'] && preg_match('/^\s*sitemap:\s*(\S+)/mi', $facts['robots']['text'], $m)) $sitemapUrl = $m[1];
$sm = fetch($sitemapUrl, 'GET', 5 * 1024 * 1024);
$smBody = $sm['status'] === 200 ? $sm['body'] : '';
$facts['sitemap'] = array('url' => $sitemapUrl, 'status' => $sm['status'], 'urls' => substr_count($smBody, '<loc>'), 'index' => stripos($smBody, '<sitemapindex') !== false, 'xml' => stripos($smBody, '<urlset') !== false || stripos($smBody, '<sitemapindex') !== false, 'lastmod' => substr_count($smBody, '<lastmod>'));
$llms = fetch($base . '/llms.txt', 'GET', 200000);
$facts['llms'] = array('status' => $llms['status'], 'bytes' => $llms['status'] === 200 && stripos(v($llms['headers']['content-type'], 'text'), 'html') === false ? strlen($llms['body']) : 0);
$nf = fetch($base . '/nikalimp-check-' . substr(md5(mt_rand()), 0, 8) . '/', 'GET', 200000);
$facts['notFound'] = array('status' => $nf['status']);
$fav = fetch($base . '/favicon.ico', 'HEAD');
$facts['faviconIco'] = $fav['status'];
// http → https
$httpV = fetch('http://' . $fp_['host'] . '/', 'GET', 20000);
$facts['httpRedirect'] = array('status' => $httpV['status'], 'location' => v($httpV['headers']['location']));
// www ↔ без www
$alt = strpos($fp_['host'], 'www.') === 0 ? substr($fp_['host'], 4) : 'www.' . $fp_['host'];
$altV = fetch($fp_['scheme'] . '://' . $alt . '/', 'GET', 20000);
$facts['wwwVariant'] = array('host' => $alt, 'status' => $altV['status'], 'location' => v($altV['headers']['location']), 'error' => v($altV['error']));

// Как сервер отвечает ботам нейросетей: часть хостингов и защит от DDoS режет их по User-Agent
$facts['bots'] = array();
foreach (array(
  'GPTBot' => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  'ClaudeBot' => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  'PerplexityBot' => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'YandexBot' => 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
) as $bot => $ua) {
  $b = fetch($facts['final'], 'GET', 4096, $ua);
  $facts['bots'][$bot] = $b['status'];
}

$res = json_encode(array('ok' => true, 'checked' => date('c'), 'facts' => $facts), defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | (defined('JSON_INVALID_UTF8_SUBSTITUTE') ? JSON_INVALID_UTF8_SUBSTITUTE : 0) : 0);
if ($res === false) out(500, array('error' => 'Не получилось собрать отчёт'));
@file_put_contents($cacheFile, $res);
echo $res;
