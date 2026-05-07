#!/bin/sh
set -e

cd "$(dirname "$0")"

docker compose down
docker compose up --build -d
docker compose logs -f
