#!/bin/bash
cd /tmp/claude-0/-home-claude/25db1ee1-33e1-57f0-b2c4-213057f29507/scratchpad
curl -s -o /dev/null http://127.0.0.1:8765/bake/bake.html || { nohup python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 & sleep 1; }
cd bake && "$@"
