#!/bin/bash

# HopeNest Database Backup Script
# This script creates automated backups of the MongoDB database

set -e

# Configuration
BACKUP_DIR="/var/backups/hopenest"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="hopenest_backup_${TIMESTAMP}"
RETENTION_DAYS=30

# MongoDB Configuration
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-hopenest}"
MONGO_USER="${MONGO_USER:-}"
MONGO_PASS="${MONGO_PASS:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Perform database backup
backup_database() {
    log "Starting database backup..."
    
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    
    # Build mongodump command
    local mongodump_cmd="mongodump --host $MONGO_HOST:$MONGO_PORT --db $MONGO_DB --out $backup_path"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
        mongodump_cmd="$mongodump_cmd --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin"
    fi
    
    # Execute backup
    if eval $mongodump_cmd; then
        log "Database backup completed: $backup_path"
        
        # Create compressed archive
        tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
        rm -rf "$backup_path"
        log "Backup compressed: ${backup_path}.tar.gz"
        
        return 0
    else
        error "Database backup failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "hopenest_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    local remaining=$(find "$BACKUP_DIR" -name "hopenest_backup_*.tar.gz" | wc -l)
    log "Cleanup completed. $remaining backup(s) remaining."
}

# Verify backup integrity
verify_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    
    if [ -f "$backup_file" ]; then
        if tar -tzf "$backup_file" >/dev/null 2>&1; then
            log "Backup verification passed: $backup_file"
            return 0
        else
            error "Backup verification failed: $backup_file"
            return 1
        fi
    else
        error "Backup file not found: $backup_file"
        return 1
    fi
}

# Send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # Add your notification logic here (email, Slack, etc.)
    # Example: curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$message\"}" "$SLACK_WEBHOOK_URL"
    
    log "Notification: $message"
}

# Main backup process
main() {
    log "HopeNest Database Backup Started"
    
    create_backup_dir
    
    if backup_database; then
        if verify_backup; then
            cleanup_old_backups
            send_notification "success" "HopeNest database backup completed successfully: ${BACKUP_NAME}.tar.gz"
            log "Backup process completed successfully"
        else
            send_notification "error" "HopeNest database backup verification failed"
            exit 1
        fi
    else
        send_notification "error" "HopeNest database backup failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        if [ -z "$2" ]; then
            error "Usage: $0 restore <backup_file>"
            exit 1
        fi
        
        BACKUP_FILE="$2"
        if [ ! -f "$BACKUP_FILE" ]; then
            error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
        
        log "Restoring database from: $BACKUP_FILE"
        
        # Extract backup
        TEMP_DIR="/tmp/hopenest_restore_$$"
        mkdir -p "$TEMP_DIR"
        tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
        
        # Find the extracted directory
        EXTRACT_DIR=$(find "$TEMP_DIR" -name "hopenest_backup_*" -type d | head -n1)
        
        if [ -z "$EXTRACT_DIR" ]; then
            error "Could not find extracted backup directory"
            rm -rf "$TEMP_DIR"
            exit 1
        fi
        
        # Restore database
        local mongorestore_cmd="mongorestore --host $MONGO_HOST:$MONGO_PORT --db $MONGO_DB --drop $EXTRACT_DIR/$MONGO_DB"
        
        if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
            mongorestore_cmd="$mongorestore_cmd --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin"
        fi
        
        if eval $mongorestore_cmd; then
            log "Database restore completed successfully"
        else
            error "Database restore failed"
            rm -rf "$TEMP_DIR"
            exit 1
        fi
        
        # Cleanup
        rm -rf "$TEMP_DIR"
        ;;
    "list")
        log "Available backups:"
        find "$BACKUP_DIR" -name "hopenest_backup_*.tar.gz" -printf "%T@ %Tc %p\n" | sort -n | cut -d' ' -f2-
        ;;
    *)
        echo "Usage: $0 {backup|restore <file>|list}"
        echo ""
        echo "Commands:"
        echo "  backup          - Create database backup (default)"
        echo "  restore <file>  - Restore database from backup file"
        echo "  list           - List available backups"
        exit 1
        ;;
esac