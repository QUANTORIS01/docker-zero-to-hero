"""
Celery tasks for URL Monitor.

The only task right now is `check_all_urls`, which:
- Reads every active MonitoredURL from the database
- Sends an HTTP GET request to each one
- Records the result (up/down, response time, error) in CheckResult

Celery Beat calls this task every 30 seconds (see config/celery.py).
"""

import time

import requests
from celery import shared_task
from requests.exceptions import RequestException

from .models import CheckResult, MonitoredURL


# How long we wait for a response before giving up, in seconds.
REQUEST_TIMEOUT = 10


@shared_task
def check_all_urls():
    """
    Check every active URL once and save the results.

    This runs as a Celery task, so it does NOT block Django from serving requests.
    """
    urls = MonitoredURL.objects.filter(is_active=True)
    checked_count = 0

    for monitored in urls:
        _check_single_url(monitored)
        checked_count += 1

    return f"Checked {checked_count} URL(s)"


def _check_single_url(monitored: MonitoredURL) -> None:
    """
    Check one URL and save the result.

    The leading underscore in the function name is a Python convention meaning
    "this is an internal helper, not meant to be called from outside".
    """
    start = time.perf_counter()

    try:
        response = requests.get(monitored.url, timeout=REQUEST_TIMEOUT)
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        # Any status code between 200 and 399 is considered "up".
        # Codes like 404 and 500 mean something is wrong.
        is_up = 200 <= response.status_code < 400

        CheckResult.objects.create(
            monitored_url=monitored,
            is_up=is_up,
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            error_message='' if is_up else f"HTTP {response.status_code}",
        )

    except RequestException as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        CheckResult.objects.create(
            monitored_url=monitored,
            is_up=False,
            status_code=None,
            response_time_ms=elapsed_ms,
            error_message=str(exc)[:500],
        )
