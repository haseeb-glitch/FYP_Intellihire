"""Project-local startup hooks for dependency compatibility.

Python imports ``sitecustomize`` automatically on startup when it is importable
from ``sys.path``. We use that hook to provide a minimal compatibility shim for
TensorFlow 2.21.x in environments where ``protobuf`` is pinned to 4.x by
MediaPipe.
"""

from __future__ import annotations

import sys
import types


def _install_protobuf_runtime_version_shim() -> None:
    """Provide the protobuf 6 runtime_version API expected by TensorFlow."""
    module_name = "google.protobuf.runtime_version"
    if module_name in sys.modules:
        return

    runtime_version = types.ModuleType(module_name)

    class Domain:
        PUBLIC = "PUBLIC"

    def validate_protobuf_runtime_version(*_args, **_kwargs) -> None:
        return None

    runtime_version.Domain = Domain
    runtime_version.ValidateProtobufRuntimeVersion = (
        validate_protobuf_runtime_version
    )
    sys.modules[module_name] = runtime_version


_install_protobuf_runtime_version_shim()
