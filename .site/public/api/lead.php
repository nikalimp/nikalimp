<?php
@ini_set('display_errors', '0');
// Заявки с формы LeadForm (src/components/lead-form.tsx), 18.11.2026.
// 1) копия каждой заявки — в /var/www/u3672757/data/leads/leads.jsonl (вне папки сайта: rsync --delete её не трогает);
// 2) сообщение в Telegram, если есть конфиг /var/www/u3672757/data/leads/config.php:
//      <?php return array('bot_token' => '123:ABC', 'chat_id' => '123456');
// 3) письмо на почту из $MAIL_TO — работает и без конфига.
// JSON-запрос (fetch) → JSON-ответ; обычный POST без JavaScript → редирект обратно на страницу с ?lead=sent.
// Совместимо с PHP 5.4+.

$MAIL_TO = 'nikitaalimpiev@mail.ru';
define('PER_HOUR', 5);

function v(&$x, $d = '') { return isset($x) ? $x : $d; }
$isJson = stripos(v($_SERVER['CONTENT_TYPE']), 'application/json') !== false;

function finish($code, $data, $isJson) {
  if ($isJson) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
    http_response_code($code);
    echo json_encode($data, defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE : 0);
    exit;
  }
  $back = v($_SERVER['HTTP_REFERER'], '/');
  if (!preg_match('~^https://(www\.)?nikalimp\.ru/~', $back)) $back = 'https://nikalimp.ru/';
  $back = preg_replace('~[?#].*$~', '', $back) . (isset($data['ok']) ? '?lead=sent' : '?lead=error') . '#lead';
  header('Location: ' . $back, true, 303);
  exit;
}

if (v($_SERVER['REQUEST_METHOD']) !== 'POST') finish(405, array('error' => 'Метод не поддерживается'), true);
$origin = v($_SERVER['HTTP_ORIGIN']);
if ($origin && !preg_match('~^https?://(www\.)?nikalimp\.ru$|^http://localhost(:\d+)?$~', $origin)) finish(403, array('error' => 'Запрещено'), $isJson);

$in = $isJson ? json_decode(file_get_contents('php://input'), true) : $_POST;
if (!is_array($in)) finish(400, array('error' => 'Пустая заявка'), $isJson);

function clean($s, $max) {
  $s = trim(preg_replace('/\s+/u', ' ', strip_tags((string)$s)));
  return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}
$lead = array(
  'time'    => date('c'),
  'name'    => clean(v($in['name']), 80),
  'contact' => clean(v($in['contact']), 120),
  'site'    => clean(v($in['site']), 200),
  'task'    => clean(v($in['task']), 500),
  'offer'   => preg_replace('/[^a-z0-9_-]/', '', strtolower((string)v($in['offer']))),
  'page'    => clean(v($in['page'], parse_url(v($_SERVER['HTTP_REFERER']), PHP_URL_PATH)), 300),
  'ip'      => v($_SERVER['HTTP_X_REAL_IP'], v($_SERVER['REMOTE_ADDR'])),
);

// Бот заполнил скрытое поле — отвечаем «успешно», но заявку не сохраняем
if (trim((string)v($in['company'])) !== '') finish(200, array('ok' => true), $isJson);
if ($lead['name'] === '' || $lead['contact'] === '') finish(400, array('error' => 'Укажите имя и контакт'), $isJson);
if (v($in['consent']) !== 'yes' && v($in['consent']) !== true) finish(400, array('error' => 'Нужно согласие на обработку данных'), $isJson);

$DIR = dirname(dirname(dirname(__DIR__))) . '/leads';
@mkdir($DIR, 0700, true);

// Не больше PER_HOUR заявок с одного IP за час
$limFile = $DIR . '/limits.json';
$lim = @json_decode(@file_get_contents($limFile), true);
if (!is_array($lim)) $lim = array();
$now = time();
foreach ($lim as $k => $ts) { $lim[$k] = array_values(array_filter((array)$ts, function ($t) use ($now) { return $t > $now - 3600; })); if (!$lim[$k]) unset($lim[$k]); }
$key = md5($lead['ip']);
if (isset($lim[$key]) && count($lim[$key]) >= PER_HOUR) finish(429, array('error' => 'Слишком много заявок подряд'), $isJson);
$lim[$key][] = $now;
@file_put_contents($limFile, json_encode($lim), LOCK_EX);

$saved = @file_put_contents($DIR . '/leads.jsonl', json_encode($lead, defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE : 0) . "\n", FILE_APPEND | LOCK_EX) !== false;

$text = "Заявка с nikalimp.ru\n"
  . "Оффер: {$lead['offer']}\nСтраница: https://nikalimp.ru{$lead['page']}\n\n"
  . "Имя: {$lead['name']}\nКонтакт: {$lead['contact']}\n"
  . ($lead['site'] !== '' ? "Сайт: {$lead['site']}\n" : '')
  . ($lead['task'] !== '' ? "Задача: {$lead['task']}\n" : '');

$sent = false;
$cfgFile = $DIR . '/config.php';
if (is_file($cfgFile)) {
  $cfg = include $cfgFile;
  if (is_array($cfg) && !empty($cfg['bot_token']) && !empty($cfg['chat_id']) && function_exists('curl_init')) {
    $ch = curl_init('https://api.telegram.org/bot' . $cfg['bot_token'] . '/sendMessage');
    curl_setopt_array($ch, array(CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
      CURLOPT_POSTFIELDS => array('chat_id' => $cfg['chat_id'], 'text' => $text, 'disable_web_page_preview' => 'true')));
    $res = json_decode((string)curl_exec($ch), true);
    curl_close($ch);
    $sent = is_array($res) && !empty($res['ok']);
  }
}

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $lead['name']) . '?=';
$mailed = @mail($MAIL_TO, $subject, $text, "From: nikalimp.ru <noreply@nikalimp.ru>\r\nContent-Type: text/plain; charset=utf-8\r\n");

if (!$saved && !$sent && !$mailed) finish(500, array('error' => 'Не получилось сохранить заявку'), $isJson);
finish(200, array('ok' => true), $isJson);
