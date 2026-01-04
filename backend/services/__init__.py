# backend/services/__init__.py

# Export only real modules
from .db import *
from .cache import *
from .sc_service import *
from .affiliates_service import *
# from .auth import *   # ❌ removed — file does not exist