"""Gunicorn configuration for Recipe Book backend."""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get('GUNICORN_WORKERS', '3'))
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '30'))
