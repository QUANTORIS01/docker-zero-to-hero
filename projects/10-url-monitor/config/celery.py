"""
Celery setup for URL Monitor.

This module creates the Celery app and tells it:
- Where the Django settings live
- Which broker to use (Redis)
- What periodic tasks to run on a schedule
"""

import os

from celery import Celery
from celery.schedules import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 'urlmonitor' is just a name for this Celery app. It doesn't have to match anything.
app = Celery('urlmonitor')

# Read all CELERY_* settings from Django settings.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tell Celery to look for tasks in files named `tasks.py` inside every installed app.
app.autodiscover_tasks()


# --------------------------------------------------------------------
# Periodic tasks (the schedule that Celery Beat reads)
# --------------------------------------------------------------------

app.conf.beat_schedule = {
    'check-all-urls-every-30-seconds': {
        'task': 'monitor.tasks.check_all_urls',
        'schedule': timedelta(seconds=30),
    },
}
