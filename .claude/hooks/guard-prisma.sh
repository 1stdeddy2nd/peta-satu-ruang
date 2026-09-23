#!/bin/bash
# Blocks Prisma commands that can empty the local database. The local database
# holds ~64M imported rows that take hours to rebuild (see 03-gotchas.md).
cmd=$(jq -r '.tool_input.command // empty')

# Only where a command can actually start, so these words inside a commit
# message, a heredoc or a grep pattern stay text rather than an invocation.
start='(^|[;&|(]|&&)[[:space:]]*((npx|pnpm|yarn|bunx|npm[[:space:]]+(run|exec))[[:space:]]+)?'

decide() {
  jq -n --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: $d, permissionDecisionReason: $r}}'
  exit 0
}

if echo "$cmd" | grep -Eq "$start"'prisma[[:space:]]+migrate[[:space:]]+reset'; then
  decide deny "That command drops every table in the database. Blocked by .claude/hooks/guard-prisma.sh."
fi
if echo "$cmd" | grep -Eq "$start"'prisma[[:space:]].*--shadow-database-url'; then
  decide deny "A shadow database is wiped before use. Read the migration SQL instead. Blocked by .claude/hooks/guard-prisma.sh."
fi
if echo "$cmd" | grep -Eq "$start"'prisma[[:space:]]+db[[:space:]]+push.*(--force-reset|--accept-data-loss)'; then
  decide deny "That command drops data. Blocked by .claude/hooks/guard-prisma.sh."
fi
if echo "$cmd" | grep -Eq "$start"'(prisma[[:space:]]+migrate[[:space:]]+dev|make[[:space:]]+(db-migrate|db-reset))'; then
  decide ask "migrate dev can reset the schema on drift, and make db-reset also deletes the MinIO archives. Hand-write the migration and use migrate deploy, or confirm this run."
fi
exit 0
