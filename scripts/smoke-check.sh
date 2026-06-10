#!/usr/bin/env bash
set -euo pipefail
printf "Checking workspace files...\n"
test -f web/package.json
test -f scanner/package.json
test -f supabase/migrations/0001_inventory_schema.sql
test -f AGENTS.md
test -f CLAUDE.md
printf "OK\n"
