"""
Celery configuration for Task Runner.
"""

import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('taskrunner')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()
