#!/usr/bin/env bash
# =============================================================================
# incremental-backup.sh
# Incremental backup of an S3 bucket to another S3 bucket.
#
# HOW TO USE (AWS CloudShell / console CLI):
#   1. Save this file:   mkdir -p ~/storage/s3 && nano ~/storage/s3/incremental-backup.sh
#      (paste the script, save with Ctrl+O, Enter, exit with Ctrl+X)
#   2. Make executable:  chmod +x ~/storage/s3/incremental-backup.sh
#   3. Run:              ~/storage/s3/incremental-backup.sh
#      Large bucket?     nohup ~/storage/s3/incremental-backup.sh > ~/s3-backup.log 2>&1 &
#                        tail -f ~/s3-backup.log
#
# WHAT IT DOES:
#   - Copies new files.
#   - Replaces files whose size differs or whose source is newer.
#   - Does NOT delete anything from the backup (no --delete).
#   - Does NOT keep old versions: replaced files are overwritten, so the
#     backup size stays under control.
#   - Uses a FIXED destination prefix (no date), so each run only copies changes.
#
# DESTINATION:
#   s3://budgetclick-storage-backup/incremental/
#
# IMPORTANT:
#   This script does not touch bucket versioning. If versioning is already
#   enabled on the backup bucket, old versions will still accumulate. To stop
#   that, run once:
#     aws s3api put-bucket-versioning --bucket budgetclick-storage-backup \
#       --versioning-configuration Status=Suspended
#   (Existing versions stay until you delete them; versioning can be suspended
#   but never fully disabled once enabled.)
#
# REQUIRED PERMISSIONS:
#   Source bucket:       s3:ListBucket, s3:GetObject
#   Destination bucket:  s3:ListBucket, s3:PutObject
#
# NOTE: CloudShell cannot run on a schedule. For a daily run, trigger this
#       script from EventBridge + CodeBuild/ECS, or re-run it manually each day.
# =============================================================================

set -euo pipefail

SRC=your-source-bucket-name
DST_BUCKET=your-destination-bucket-name
DST="s3://$DST_BUCKET/incremental/"

echo "$(date -Is) starting backup: s3://$SRC -> $DST"

aws s3 sync "s3://$SRC" "$DST" \
  --storage-class STANDARD_IA \
  --only-show-errors

echo "$(date -Is) backup finished"