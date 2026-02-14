#!/bin/sh
set -e

npx prisma db push --accept-data-loss --skip-generate

if [ "${RUN_PRISMA_SEED:-0}" = "1" ]; then
  npx prisma db seed
fi

if [ "$#" -eq 0 ]; then
  set -- npm start
fi

exec "$@"
