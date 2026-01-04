def require_fields(data: dict, fields: list):
    """
    Ensures all required fields exist in the incoming data dict.
    Raises a clean, explicit error listing all missing fields.
    """
    if not isinstance(data, dict):
        raise ValueError("Input data must be a dictionary")

    missing = [field for field in fields if field not in data or data[field] is None]

    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    return True