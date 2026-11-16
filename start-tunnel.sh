#!/usr/bin/env bash
# start-tunnel.sh — поднимает WorkSpot (MongoDB, Redis, API, Vite) и публикует
# приложение в интернете через туннель ngrok.
#
# Использование:
#   ./start-tunnel.sh              # запуск (Ctrl-C — остановить всё)
#   ./start-tunnel.sh --seed       # то же + пересоздать демо-данные в MongoDB
#   ./start-tunnel.sh --no-tunnel  # только локальный запуск, без ngrok
#   ./start-tunnel.sh --stop       # остановить всё, что запускал скрипт
#
# Постоянный адрес: возьмите бесплатный static domain в панели ngrok и
# запускайте так (либо впишите его в NGROK_DOMAIN ниже):
#   NGROK_DOMAIN=my-app.ngrok-free.app ./start-tunnel.sh

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS="$ROOT/.logs"
ENV_FILE="$ROOT/server/.env"

SERVER_PORT=4000
CLIENT_PORT=5173
NGROK_API="http://127.0.0.1:4040/api/tunnels"
LOCK_FILE="$LOGS/run.lock"
PID_FILE="$LOGS/run.pid"
NGROK_PID_FILE="$LOGS/ngrok.pid"

# Пусто — ngrok выдаст случайный адрес (он меняется при каждом запуске).
NGROK_DOMAIN="${NGROK_DOMAIN:-}"
NGROK_BIN="${NGROK_BIN:-$(command -v ngrok || echo "$HOME/.local/bin/ngrok")}"
START_NGROK=1
DO_SEED=0
DO_STOP=0
PUBLIC_URL=""
CLEANED=0

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

usage() { sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0; }

for arg in "$@"; do
  case "$arg" in
    --seed)      DO_SEED=1 ;;
    --no-tunnel) START_NGROK=0 ;;
    --stop)      DO_STOP=1 ;;
    -h|--help)   usage ;;
    *)           die "Неизвестный аргумент: $arg (см. --help)" ;;
  esac
done

# --- остановка ---------------------------------------------------------------

kill_port() { # kill_port <порт> — гасит процесс, слушающий порт
  local port=$1 pids p
  pids=$(ss -ltnpH "sport = :$port" 2>/dev/null | grep -o 'pid=[0-9]*' \
         | cut -d= -f2 | sort -u || true)
  for p in $pids; do kill -TERM "$p" 2>/dev/null || true; done
}

kill_own() { # kill_own <каталог> <шаблон cmdline> — только процессы из этого каталога
  local dir=$1 pattern=$2 pid cwd
  for pid in $(pgrep -f "$pattern" 2>/dev/null || true); do
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || true)
    [[ "$cwd" == "$dir" ]] && kill -TERM "$pid" 2>/dev/null || true
  done
}

ngrok_cmdline() { # командная строка процесса; пусто, если процесс уже умер
  tr '\0' ' ' <"/proc/$1/cmdline" 2>/dev/null || true
}

stop_ngrok() {
  local pid
  # Сначала по pid-файлу: гасим только свой ngrok, а не любой чужой на машине.
  if [[ -f "$NGROK_PID_FILE" ]]; then
    pid=$(cat "$NGROK_PID_FILE" 2>/dev/null || true)
    rm -f "$NGROK_PID_FILE"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      [[ "$(ngrok_cmdline "$pid")" == *"$LOGS/ngrok.log"* ]] \
        && { kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true; }
    fi
  fi
  # Подстраховка для прошлых версий скрипта: тоже только процессы с нашим логом.
  for pid in $(pgrep -f "ngrok http" 2>/dev/null || true); do
    [[ "$(ngrok_cmdline "$pid")" == *"$LOGS/ngrok.log"* ]] \
      && kill -TERM "$pid" 2>/dev/null || true
  done
  # Даём агенту отпустить порт web-интерфейса, иначе новый запуск не встанет на 4040.
  for _ in $(seq 1 15); do
    ss -ltnH "sport = :4040" 2>/dev/null | grep -q . || break
    sleep 0.2
  done
}

port_busy() { ss -ltnH "sport = :$1" 2>/dev/null | grep -q .; }

wait_port_free() { # wait_port_free <порт> <секунды>
  local port=$1 timeout=$2 i=0
  while port_busy "$port"; do
    i=$((i + 1))
    if (( i > timeout * 5 )); then
      kill_port "$port"
      sleep 0.5
      port_busy "$port" && die "порт $port занят чужим процессом"
      break
    fi
    sleep 0.2
  done
}

stop_all() {
  local f pid
  for f in "$LOGS/server.pid" "$LOGS/client.pid"; do
    [[ -f "$f" ]] || continue
    pid=$(cat "$f" 2>/dev/null || true)
    # Скрипт запускает npm в отдельной сессии (setsid) — гасим всю группу.
    [[ -n "$pid" ]] && { kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true; }
    rm -f "$f"
  done
  # Подстраховка от запусков вручную/из прошлых версий скрипта.
  kill_own "$ROOT/server" "node --watch src/index.js"
  kill_own "$ROOT/client" "node_modules/.bin/vite|vite/bin/vite"
  kill_port "$SERVER_PORT"
  kill_port "$CLIENT_PORT"
  stop_ngrok
  wait_port_free "$SERVER_PORT" 5
  wait_port_free "$CLIENT_PORT" 5
}

cleanup() {
  (( CLEANED )) && return
  CLEANED=1
  say "Останавливаю WorkSpot…"
  rm -f "$PID_FILE"
  stop_all
}
on_signal() { cleanup; exit 130; }

[[ $DO_STOP -eq 1 ]] && { stop_all; say "Остановлено."; exit 0; }

trap cleanup EXIT
trap on_signal INT TERM

# --- утилиты -----------------------------------------------------------------

wait_http() { # wait_http <url> <секунды> <описание>
  local url=$1 timeout=$2 what=$3 i=0
  while ! curl -sf -m 2 -o /dev/null "$url"; do
    i=$((i + 1))
    (( i > timeout * 5 )) && die "не дождался $what ($url)"
    sleep 0.2
  done
}

require_ngrok() {
  [[ -x "$NGROK_BIN" ]] || die "ngrok не найден. Установите: yay -S ngrok
    либо скачайте бинарник в ~/.local/bin"
  local cfg="${NGROK_CONFIG:-$HOME/.config/ngrok/ngrok.yml}"
  grep -qs 'authtoken' "$cfg" 2>/dev/null || die "нет authtoken ngrok. Выполните:
      ngrok config add-authtoken ВАШ_ТОКЕН
    Токен: https://dashboard.ngrok.com/get-started/your-authtoken"
  command -v jq >/dev/null || die "нужен jq: sudo pacman -S jq"
}

# Прописывает публичный адрес в CORS_ORIGINS, не трогая остальной .env.
patch_cors() { # patch_cors <public-url>
  [[ -f "$ENV_FILE" ]] || cp "$ROOT/server/.env.example" "$ENV_FILE"
  python3 - "$ENV_FILE" "$1" <<'PY'
import sys

path, url = sys.argv[1], sys.argv[2]
base = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
line = "CORS_ORIGINS=" + ",".join(base + [url])

with open(path, encoding="utf-8") as fh:
    rows = fh.read().splitlines()

out, replaced = [], False
for row in rows:
    if row.startswith("CORS_ORIGINS="):
        out.append(line)
        replaced = True
    else:
        out.append(row)
if not replaced:
    out.append(line)

with open(path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out) + "\n")
PY
}

# --- подготовка --------------------------------------------------------------

say "WorkSpot: $ROOT"
mkdir -p "$LOGS"

# Один стенд на машину. Без блокировки второй запуск гасил процессы первого —
# включая только что поднятый ngrok (в его логе видно «received stop request»).
exec 8>"$LOCK_FILE"
if ! flock -n 8; then
  old_pid=$(cat "$PID_FILE" 2>/dev/null || true)
  warn "WorkSpot уже запущен${old_pid:+ (PID $old_pid)} — останавливаю предыдущий экземпляр"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null \
     && [[ "$(ngrok_cmdline "$old_pid")" == *"start-tunnel.sh"* ]]; then
    kill -TERM "$old_pid" 2>/dev/null || true
  fi
  for _ in $(seq 1 50); do
    flock -n 8 && break
    sleep 0.2
  done
  flock -n 8 || die "предыдущий запуск не завершился за 10 с, см. $LOGS/run.log"
fi
echo $$ >"$PID_FILE"

stop_all   # чистое поле: гасим прошлые запуски, чтобы не конфликтовали порты

say "MongoDB и Redis (user-сервисы)"
systemctl --user start mongodb redis 2>/dev/null \
  || warn "не удалось запустить mongodb/redis через systemctl --user"
systemctl --user is-active --quiet mongodb || warn "mongodb не активен"
systemctl --user is-active --quiet redis   || warn "redis не активен"

for part in server client; do
  if [[ ! -d "$ROOT/$part/node_modules" ]]; then
    say "Устанавливаю зависимости $part"
    ( cd "$ROOT/$part" && npm install --no-fund --no-audit )
  fi
done

if [[ $START_NGROK -eq 1 ]]; then
  require_ngrok
  say "Запускаю ngrok на 127.0.0.1:$CLIENT_PORT"
  # Всё пишем в ngrok.log (JSON): ngrok.out остаётся пустым, поэтому в подсказках
  # ниже фигурирует именно ngrok.log.
  args=(http "127.0.0.1:$CLIENT_PORT" --log "$LOGS/ngrok.log" --log-format json)
  [[ -n "$NGROK_DOMAIN" ]] && args+=(--url "$NGROK_DOMAIN")
  setsid "$NGROK_BIN" "${args[@]}" >"$LOGS/ngrok.out" 2>&1 8>&- &
  NGROK_PID=$!
  echo "$NGROK_PID" >"$NGROK_PID_FILE"

  i=0
  while ! PUBLIC_URL=$(curl -sf -m 2 "$NGROK_API" | jq -r '.tunnels[0].public_url // empty' 2>/dev/null) \
        || [[ -z "$PUBLIC_URL" ]]; do
    if ! kill -0 "$NGROK_PID" 2>/dev/null; then
      warn "ngrok завершился. Последние строки $LOGS/ngrok.log:"
      tail -n 20 "$LOGS/ngrok.log" >&2 2>/dev/null || true
      die "не удалось поднять туннель"
    fi
    i=$((i + 1))
    if (( i > 60 )); then
      warn "ngrok не ответил за 30 с. Последние строки $LOGS/ngrok.log:"
      tail -n 20 "$LOGS/ngrok.log" >&2 2>/dev/null || true
      die "не удалось поднять туннель"
    fi
    sleep 0.5
  done
  say "Публичный адрес: $PUBLIC_URL"

  patch_cors "$PUBLIC_URL"
  say "CORS_ORIGINS обновлён в server/.env"
fi

if [[ $DO_SEED -eq 1 ]]; then
  say "Пересоздаю демо-данные (npm run seed)"
  ( cd "$ROOT/server" && npm run seed ) || warn "seed завершился с ошибкой"
fi

say "Запускаю API на :$SERVER_PORT"
setsid bash -c "cd '$ROOT/server' && exec npm run dev" >"$LOGS/server.log" 2>&1 8>&- &
SERVER_PID=$!
echo "$SERVER_PID" >"$LOGS/server.pid"
wait_http "http://127.0.0.1:$SERVER_PORT/healthz" 60 "API"
grep -q 'EADDRINUSE' "$LOGS/server.log" && die "порт $SERVER_PORT занят, см. $LOGS/server.log"

say "Запускаю frontend на :$CLIENT_PORT"
setsid bash -c "cd '$ROOT/client' && exec npm run dev -- --host 127.0.0.1" \
  >"$LOGS/client.log" 2>&1 8>&- &
CLIENT_PID=$!
echo "$CLIENT_PID" >"$LOGS/client.pid"
wait_http "http://127.0.0.1:$CLIENT_PORT/" 60 "Vite"
grep -q 'EADDRINUSE' "$LOGS/client.log" && die "порт $CLIENT_PORT занят, см. $LOGS/client.log"

if [[ $START_NGROK -eq 1 ]]; then
  code=$(curl -s -m 20 -o /dev/null -w '%{http_code}' \
    -H 'ngrok-skip-browser-warning: true' "$PUBLIC_URL/" || echo 000)
  [[ "$code" == "200" ]] || warn "через туннель пришёл HTTP $code — смотрите $LOGS/ngrok.log"
fi

echo
say "Готово"
printf '   Локально: http://localhost:%s\n' "$CLIENT_PORT"
printf '   API:      http://localhost:%s/healthz\n' "$SERVER_PORT"
[[ -n "$PUBLIC_URL" ]] && printf '   Публично: %s\n' "$PUBLIC_URL"
printf '   Демо:     demo@workspot.kz / WorkSpot2026\n'
printf '   Логи:     %s\n' "$LOGS"
[[ -n "$PUBLIC_URL" ]] && warn "в браузере один раз нажмите OK на заглушке ngrok"
echo
say "Ctrl-C — остановить всё"

# Следим за живостью процессов: как только кто-то умер — выходим.
# Проверяем PID, а не HTTP: Vite HMR и node --watch перезапускаются сами,
# и короткий простой не должен гасить весь стенд.
while :; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    warn "API остановился, смотрите $LOGS/server.log"
    exit 1
  fi
  if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
    warn "frontend остановился, смотрите $LOGS/client.log"
    exit 1
  fi
  if [[ -n "$PUBLIC_URL" ]]; then
    if ! kill -0 "$NGROK_PID" 2>/dev/null; then
      warn "ngrok остановился, последние строки $LOGS/ngrok.log:"
      tail -n 10 "$LOGS/ngrok.log" >&2 2>/dev/null || true
      exit 1
    fi
    curl -sf -m 2 -o /dev/null "$NGROK_API" \
      || { warn "туннель ngrok закрылся, смотрите $LOGS/ngrok.log"; exit 1; }
  fi
  sleep 3
done
