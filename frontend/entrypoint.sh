#!/bin/sh
# Entrypoint for frontend container: choose correct proxy file then start dev server
set -e

# If a docker-specific proxy file exists in the mounted app directory, copy it
if [ -f /app/proxy.docker.conf.json ]; then
  echo "Using docker proxy config: copying /app/proxy.docker.conf.json -> /app/proxy.conf.json"
  cp /app/proxy.docker.conf.json /app/proxy.conf.json
fi

echo "Starting Angular dev server with proxy..."
exec npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json
