#!/bin/bash
set -e

# COC 平台 PostgreSQL 恢复脚本
# 用法: ./scripts/restore.sh <备份文件路径>
# 示例: ./scripts/restore.sh ./backups/coc_backup_20260504_120000.sql.gz

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-coc-postgres}"
DB_NAME="${DB_NAME:-coc}"
DB_USER="${DB_USER:-coc}"

if [ -z "$BACKUP_FILE" ]; then
  echo "错误: 请指定备份文件路径"
  echo "用法: $0 <备份文件路径>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "错误: 备份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 准备从 $BACKUP_FILE 恢复数据库 $DB_NAME ..."
echo "警告: 这将覆盖现有数据库数据！"
read -p "确认恢复? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "已取消恢复"
  exit 0
fi

# 解压如果是 gzip
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 解压备份文件..."
  gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
else
  cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 数据库恢复完成"
