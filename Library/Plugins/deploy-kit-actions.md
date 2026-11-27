---
name: Deploy Kit (GitHub Actions)
title: Deploy Kit в GitHub Actions: автодеплой Next.js по SSH
description: Как настроить Deploy Kit в GitHub Actions для автопроверки, автослияния PR и выкладки статического сайта Next.js по SSH и FTP на хостинг в РФ.
short: Пайплайн проверок, автослияния PR и деплоя по SSH/FTP
category: Контент, выкладка и заявки
kind: Пайплайн CI/CD
install: mkdir -p .github/workflows && touch publish.json .github/workflows/{pr,deploy}.yml
worksWith: GitHub Actions, SSH, FTP, Next.js, REG.RU
agents: release-bot, frontend-dev
related: github-pr-plugin, yandex-webmaster-mcp, site-health-monitor
---

Deploy Kit — единый сценарий GitHub Actions для всех статических сайтов на Next.js. Он проверяет Pull Request через `npm run check`, автоматически сливает проверенную ветку агента в `main`, выкладывает папку `out/` на российский хостинг по SSH (с резервом по FTP) и отправляет новые адреса в IndexNow.

## Зачем нужен этот плагин

Когда сайтов больше одного, настраивать деплой с нуля для каждого проекта долго и рискованно. Deploy Kit выносит общую логику в переиспользуемые workflow (`pr.yml` и `site.yml`), а в самом проекте остаётся только короткий паспорт `publish.json` и секреты хостинга.

## Инструкция по установке

1. Создайте в корне репозитория паспорт `publish.json` с адресом сайта и путями сборки.
2. Добавьте в GitHub → `Settings → Secrets and variables → Actions` секреты вашего хостинга: `SSH_KEY` (приватный ключ), а также резервные `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_DIR` и токен Telegram-бота для уведомлений.
3. Создайте `.github/workflows/pr.yml` для автоматической проверки и выкладки веток `claude/*`:

```yaml
name: PR
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  pr:
    permissions: { contents: write, pull-requests: write }
    uses: nikalimp/deploy-kit/.github/workflows/pr.yml@main
    with:
      site_dir: ".site"
```

4. Добавьте `.github/workflows/deploy.yml` на `push` в `main`, чтобы коммиты со статьями из контент-завода выкладывались автоматически без лишних шагов.

## Как проверить, что всё работает

Создайте тестовую ветку `claude/test-deploy`, внесите небольшое изменение и откройте PR. Во вкладке **Actions** появится запуск `PR`: после зелёного `npm run check` ветка сама сольётся в `main`, а через пару минут сайт обновится на хостинге.

## Частые ошибки

- Забывают выдать workflow права `contents: write` и `pull-requests: write` — автослияние PR не срабатывает.
- Выкладывают сайт в корневую папку вместо конкретной директории домена (`/var/www/.../www/example.ru/`).
- Хранят SSH-ключ с парольной фразой, которую GitHub Actions не может ввести интерактивно.

## Частые вопросы

### Сколько стоят минуты GitHub Actions для такого деплоя?

Для публичных репозиториев минуты GitHub Actions полностью бесплатны. Для приватных входит 2 000 бесплатных минут в месяц — этого хватает на сотни выкладок.

### Почему выбран деплой на хостинг в РФ, а не Vercel?

В России Vercel периодически открывается нестабильно у части провайдеров. Статическая сборка `out/` на REG.RU или Timeweb работает быстро, стабильно и стоит копейки.

### Можно ли остановить автослияние для критичного PR?

Да. Если повесить на PR метку `needs-nik` или затронуть файлы в `.github/` и `publish.json`, пайплайн проверит сборку и остановится в ожидании ручного одобрения.
