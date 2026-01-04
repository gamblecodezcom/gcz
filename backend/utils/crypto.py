import hashlib

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

def sha1(text: str) -> str:
    return hashlib.sha1(text.encode()).hexdigest()