import hashlib
from typing import Union


def _to_bytes(value: Union[str, bytes]) -> bytes:
    """
    Normalizes input into bytes.
    Accepts str or bytes.
    """
    if isinstance(value, bytes):
        return value
    return str(value).encode("utf-8")


def sha256(value: Union[str, bytes]) -> str:
    """
    Returns SHA-256 hex digest.
    """
    return hashlib.sha256(_to_bytes(value)).hexdigest()


def sha1(value: Union[str, bytes]) -> str:
    """
    Returns SHA-1 hex digest.
    """
    return hashlib.sha1(_to_bytes(value)).hexdigest()