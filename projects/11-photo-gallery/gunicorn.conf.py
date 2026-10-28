"""
Gunicorn configuration for Photo Gallery.

We use a separate config file (instead of command-line flags) so we can
read values from environment variables, keep the Dockerfile CMD clean,
and still use the "exec form" (which handles signals correctly).

Run with:
    gunicorn -c gunicorn.conf.py config.wsgi:application
"""

import os

# Listen on all interfaces so Docker's port mapping can reach us.
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Number of worker processes.
# A safe default is (2 * CPU cores) + 1. For a tiny project, 3 is plenty.
workers = int(os.environ.get('GUNICORN_WORKERS', '3'))

# Send access and error logs to stdout/stderr so `docker logs` sees them.
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')

# Restart a worker if it hangs for too long. This is a safety net.
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '30'))
