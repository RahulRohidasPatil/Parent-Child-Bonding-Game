#!/usr/bin/env python3
"""Restore the handoff outside the host repository, verifying every source file."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parent
if len(sys.argv) != 2:
    raise SystemExit("Usage: python3 unpack.py /path/outside/repo/diff-avatar-builder")
destination = Path(sys.argv[1]).expanduser().resolve()
repository = root.parents[1]
if destination.is_relative_to(repository):
    raise SystemExit("Choose a destination outside this repository to keep the app build isolated.")
if destination.exists():
    raise SystemExit("Destination already exists; choose a new directory.")
records = json.loads((root / "SOURCE_FILES.json").read_text())["files"]
with zipfile.ZipFile(root / "SOURCE_CODE.zip") as archive:
    for record in records:
        relative = Path(record["path"])
        if relative.is_absolute() or ".." in relative.parts:
            raise SystemExit("Unsafe inventory path")
        if relative.parts[0] in ("src", "scripts", "tests"):
            data = archive.read(str(relative))
        else:
            data = (root / relative).read_bytes()
        if hashlib.sha256(data).hexdigest() != record["sha256"]:
            raise SystemExit("Checksum mismatch: " + str(relative))
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
(destination / "README.md").write_text((root / "README.md").read_text())
print(f"Restored and verified {len(records)} files in {destination}")
