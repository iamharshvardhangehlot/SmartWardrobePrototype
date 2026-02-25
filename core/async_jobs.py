from concurrent.futures import ThreadPoolExecutor

_EXECUTOR = ThreadPoolExecutor(max_workers=2)


def submit_job(fn, *args, **kwargs):
    return _EXECUTOR.submit(fn, *args, **kwargs)
