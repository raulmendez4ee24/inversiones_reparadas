from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from cryptography.fernet import Fernet, InvalidToken


class CryptoError(RuntimeError):
    pass


@dataclass(frozen=True)
class CryptoConfig:
    key: str


_PREFIX = "enc:"


def _load_config() -> CryptoConfig | None:
    key = os.getenv("DATA_ENCRYPTION_KEY", "").strip()
    if not key:
        return None
    return CryptoConfig(key=key)


def _fernet() -> Fernet:
    cfg = _load_config()
    if not cfg:
        raise CryptoError(
            "Falta DATA_ENCRYPTION_KEY. Genera una llave y configúrala como variable de entorno."
        )
    try:
        return Fernet(cfg.key.encode("utf-8"))
    except Exception as exc:  # pragma: no cover
        raise CryptoError("DATA_ENCRYPTION_KEY invalida (debe ser Fernet urlsafe base64).") from exc


def is_encrypted(value: str | None) -> bool:
    if not value:
        return False
    return value.startswith(_PREFIX)


def encrypt_text(value: str) -> str:
    """
    Encrypts a string for storage.

    Requires DATA_ENCRYPTION_KEY to be set (Fernet key).
    """
    if value is None:
        return ""
    value = str(value)
    if value == "":
        return ""
    if is_encrypted(value):
        return value
    token = _fernet().encrypt(value.encode("utf-8")).decode("utf-8")
    return f"{_PREFIX}{token}"


def decrypt_text(value: str | None) -> str:
    if value is None:
        return ""
    value = str(value)
    if not is_encrypted(value):
        return value

    token = value[len(_PREFIX) :]
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise CryptoError("No se pudo descifrar un valor guardado (llave incorrecta).") from exc


def encrypt_json(obj: Any) -> str:
    return encrypt_text(json.dumps(obj, ensure_ascii=False))


def decrypt_json(value: str | None) -> Any:
    raw = decrypt_text(value)
    if not raw:
        return None
    return json.loads(raw)

