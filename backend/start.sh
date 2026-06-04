#!/usr/bin/env sh
set -eu

ROLE="${APP_ROLE:-web}"

if [ "$ROLE" = "worker" ]; then
  exec celery -A celery_worker worker \
    --loglevel=info \
    --pool=prefork \
    --concurrency="${CELERY_WORKER_CONCURRENCY:-4}"
elif [ "$ROLE" = "beat" ]; then
  exec celery -A celery_worker beat --loglevel=info
else
  exec gunicorn \
    --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
    --workers 1 \
    --bind "0.0.0.0:${PORT:-5000}" \
    wsgi:app
fi
