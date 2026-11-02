"""
Celery task that runs in the background.

When a Task is created via the API, the view dispatches this task.
The worker picks it up, processes it, and updates the Task's status.
"""

import time

from celery import shared_task

from .models import Task


# Simulated processing time, in seconds.
PROCESSING_SECONDS = 10


@shared_task
def process_task(task_id: int) -> str:
    """
    Simulate processing a task.

    Steps:
    - Set status to 'processing'
    - Sleep for PROCESSING_SECONDS
    - Set status to 'done' and fill in the result
    """
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return f"Task {task_id} not found"

    task.status = Task.Status.PROCESSING
    task.save(update_fields=['status', 'updated_at'])

    time.sleep(PROCESSING_SECONDS)

    task.status = Task.Status.DONE
    task.result = f"Processed '{task.title}' successfully."
    task.save(update_fields=['status', 'result', 'updated_at'])

    return f"Task {task_id} done"
