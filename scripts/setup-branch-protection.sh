#!/usr/bin/env bash
# Branch protection untuk main (jalankan sekali oleh owner repo, butuh gh CLI
# yang sudah ter-autentikasi dengan akses admin):
#
#   ./scripts/setup-branch-protection.sh [owner/repo]
#
# Kebijakan: PR wajib, 1 approval, CI hijau (quality + db), tanpa force push.
set -euo pipefail

REPO="${1:-begawansemar7-pixel/dps-portal}"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI diperlukan (https://cli.github.com)." >&2
  exit 1
fi

gh api -X PUT "repos/${REPO}/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["quality", "db"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

echo "Branch protection aktif di ${REPO}@main"
