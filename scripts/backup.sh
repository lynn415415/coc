#!/bin/bash
set -e

# COC 平台 PostgreSQL 备份脚本
# 用法: ./scripts/backup.sh [备份目录]
# 示例: ./scripts/backup.sh ./backups

BACKUP_DIR="${1:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-coc-postgres}"
DB_NAME="${DB_NAME:-coc}"
DB_USER="${DB_USER:-coc}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/coc_backup_${TIMESTAMP}.sql"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份数据库 $DB_NAME ..."

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges > "$BACKUP_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份完成: $BACKUP_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 错误: 容器 $CONTAINER_NAME 未运行"
  exit 1
fi

# 压缩备份
gzip -f "$BACKUP_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 已压缩: ${BACKUP_FILE}.gz"

# 清理过期备份
DELETED=$(find "$BACKUP_DIR" -name 'coc_backup_*.sql.gz' -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理了 $DELETED 个过期备份（保留 ${RETENTION_DAYS} 天）"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份任务完成"
