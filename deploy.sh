#!/bin/bash
set -e

APP_NAME="Resort-2026"
APP_DIR="/var/www/Resort-2026/backend"

echo "?? Starting deployment..."

cd $APP_DIR

echo "?? Pulling latest code..."
git fetch origin
git reset --hard origin/main

echo "?? Installing dependencies..."
npm install --production

echo "?? Restarting app with PM2..."
pm2 restart $APP_NAME

# Optional: reload nginx if config changed
# echo "?? Reloading Nginx..."
# sudo nginx -t && sudo systemctl reload nginx

echo "? Deployment finished!"
