from dataclasses import dataclass
from multiprocessing import Queue as mpQueue

# Local files
import waller_lib as waller
import db

@dataclass
class JobItem:
    """
    Dataclass for queuing segmentation jobs by bundling ids with save_path.

    Attributes:
        id (str): ID of job.
        src_path (str): Path to source image on disk. Included since although
        img name is its id, the extension may either be .jpg or .png, and it was
        slightly easier to store src path rather than just extension.

    Todo:
        * Refactor ids from str to ints
        * Refactor src_path to just specify file type
        * Move job queue from memory to disk to decrease memory usage and
        increase queue storage (non-urgent, shouldn't have enough jobs
        queued to make impact on performance).
    """

    id: str
    src_path: str


def model_loop(request_q: mpQueue):
    model = waller.WallerProcess()
    print("Model loaded")
    while True:
        # wait until request in queue
        job: JobItem = request_q.get(block=True)

        db.exec_query(
            f'UPDATE img_status\
            SET status = "processing"\
            WHERE id = {job.id}'
        )

        # do the thing
        # cpu_bound_task(queue_item)
        model.process_image(job.src_path, f"data/processed/{job.id}.png")

        # TODO add check if processing unsuccessful (res is invalid)
        db.exec_query(
            f'UPDATE img_status\
            SET status = "done"\
            WHERE id = {job.id}'
        )