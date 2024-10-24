---
"vite-bundler": patch
---

Patch cacheable files in memory instead of trying to write to the target arch's program.json file which could be marked as read-only.
