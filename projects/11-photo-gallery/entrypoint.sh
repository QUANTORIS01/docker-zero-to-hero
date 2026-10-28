#!/bin/sh
set -e

# Docker creates named volumes with root:root ownership, regardless of what
# the Dockerfile set up. On first run, we are root, so we fix the ownership
# of the mounted volumes, then re-exec this script as appuser.
if [ "$(id -u)" = "0" ]; then
    echo "Fixing volume permissions..."
    chown -R appuser:appuser /app/staticfiles /app/media
    exec gosu appuser "$0" "$@"
fi

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting: $*"
exec "$@"
