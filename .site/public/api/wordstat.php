<?php
@ini_set('display_errors', '0'); // предупреждения PHP не должны ломать JSON-ответ
// Прокси к Yandex Wordstat API (Yandex Cloud Search API) для инструмента /semantics/.
// Платная опция: запросы проходят только с кодом доступа из конфига.
//
// Конфиг и данные лежат ВНЕ папки сайта, чтобы rsync --delete при выкладке их не стёр
// и чтобы ключ не был доступен по HTTP:
//   /var/www/u3672757/data/wordstat/config.php   — ключ, папка, коды доступа (образец — .site/scripts/wordstat-config.example.php)
//   /var/www/u3672757/data/wordstat/usage.json   — сколько запросов потратил каждый код (создаётся сам)
//   /var/www/u3672757/data/wordstat/cache/       — кэш ответов на 30 дней: повтор не тратит ни лимит, ни деньги
//
// GET  ?status                       → {"enabled":bool}
// POST {"action":"check","code":…}   → {"ok":true,"left":N}
// POST {"action":"top","code":…,"phrase":…,"region":"213"} → {"results":[…],"associations":[…],"left":N,"cached":bool}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$DIR = dirname(dirname(dirname(__DIR__))) . '/wordstat';
$CFG = $DIR . '/config.php';
$cfg = is_file($CFG) ? (include $CFG) : null;
$enabled = is_array($cfg) && !empty($cfg['api_key']) && !empty($cfg['folder_id']) && !empty($cfg['codes']);

// Совместимо с PHP 5.6: без оператора ?? (на хостинге старая версия PHP)
function v(&$x, $d = null) { return isset($x) ? $x : $d; }
function out($code, $data) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') out(200, ['enabled' => $enabled]);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'Метод не поддерживается']);
if (!$enabled) out(503, ['error' => 'Сбор из Вордстата пока не подключён']);

// Только со своего сайта
$origin = v($_SERVER['HTTP_ORIGIN'], '');
if ($origin && !preg_match(v($cfg['origin'], '~^https://(www\.)?nikalimp\.ru$~'), $origin)) out(403, ['error' => 'Запрещено']);

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$code = strtoupper(trim((string)(v($in['code'], ''))));
$codes = array_change_key_case($cfg['codes'], CASE_UPPER);
if ($code === '' || !isset($codes[$code])) { usleep(400000); out(401, ['error' => 'Неверный код доступа']); }

$limit = (int)(v($codes[$code]['requests'], 0));
$until = v($codes[$code]['until'], null); // 'YYYY-MM-DD' — до какого дня действует код
if ($until && date('Y-m-d') > $until) out(402, ['error' => 'Срок действия кода закончился']);

@mkdir($DIR . '/cache', 0700, true);
$usageFile = $DIR . '/usage.json';
$fp = fopen($usageFile, 'c+');
flock($fp, LOCK_EX);
$usage = json_decode(stream_get_contents($fp), true) ?: [];
$used = (int)(v($usage[$code]['used'], 0));
$left = max(0, $limit - $used);

function save_usage($fp, $usage) { ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($usage, JSON_UNESCAPED_UNICODE)); fflush($fp); }

$action = v($in['action'], '');
if ($action === 'check') { flock($fp, LOCK_UN); out(200, ['ok' => true, 'left' => $left]); }
if ($action !== 'top') { flock($fp, LOCK_UN); out(400, ['error' => 'Неизвестное действие']); }

$phrase = trim(preg_replace('/\s+/u', ' ', (string)(v($in['phrase'], ''))));
$region = preg_replace('/\D/', '', (string)(v($in['region'], '225'))) ?: '225';
if ($phrase === '' || mb_strlen($phrase) > 400) { flock($fp, LOCK_UN); out(400, ['error' => 'Пустая или слишком длинная фраза']); }

// Кэш: тот же запрос и регион за 30 дней — бесплатно
$cacheFile = $DIR . '/cache/' . md5(mb_strtolower($phrase) . '|' . $region) . '.json';
if (is_file($cacheFile) && filemtime($cacheFile) > time() - 30 * 86400) {
  flock($fp, LOCK_UN);
  $data = json_decode(file_get_contents($cacheFile), true);
  out(200, $data + ['left' => $left, 'cached' => true]);
}

if ($left <= 0) { flock($fp, LOCK_UN); out(402, ['error' => 'Лимит запросов по коду исчерпан', 'left' => 0]); }

// Не больше N запросов в минуту на код — защита от зацикливания
$minute = date('YmdHi');
$perMin = (int)(v($cfg['max_per_minute'], 60));
if ((v($usage[$code]['minute'], '')) === $minute && (int)(v($usage[$code]['in_minute'], 0)) >= $perMin) { flock($fp, LOCK_UN); out(429, ['error' => 'Слишком часто, подождите минуту', 'left' => $left]); }

$ch = curl_init(v($cfg['endpoint'], 'https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests'));
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 25,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Api-Key ' . $cfg['api_key']],
  CURLOPT_POSTFIELDS => json_encode(['phrase' => $phrase, 'numPhrases' => '2000', 'regions' => [$region], 'devices' => ['DEVICE_ALL'], 'folderId' => $cfg['folder_id']], JSON_UNESCAPED_UNICODE),
]);
$body = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if (PHP_VERSION_ID < 80000) curl_close($ch);

if ($http !== 200 || !$body) { flock($fp, LOCK_UN); out(502, ['error' => 'Вордстат не ответил (' . $http . '), попробуйте позже', 'left' => $left]); }

$api = json_decode($body, true) ?: [];
$map = function ($list) { return array_map(function ($x) { return ['phrase' => (string)$x['phrase'], 'count' => (int)$x['count']]; }, is_array($list) ? $list : []); };
$data = ['results' => $map(v($api['results'], [])), 'associations' => $map(v($api['associations'], [])), 'total' => (int)(v($api['totalCount'], 0))];
file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE));

$inMinute = ((v($usage[$code]['minute'], '')) === $minute ? (int)(v($usage[$code]['in_minute'], 0)) : 0) + 1;
$usage[$code]['used'] = $used + 1;
$usage[$code]['minute'] = $minute;
$usage[$code]['in_minute'] = $inMinute;
$usage[$code]['last'] = date('c');
save_usage($fp, $usage);
flock($fp, LOCK_UN);

out(200, $data + ['left' => $left - 1, 'cached' => false]);
