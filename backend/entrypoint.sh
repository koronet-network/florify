#!/bin/sh
set -e

echo "Waiting for DynamoDB Local..."
until nc -z dynamodb-local 8000 2>/dev/null; do
  sleep 1
done
echo "DynamoDB Local is ready."

echo "Initializing database..."
node dist/init-db.js

echo "Starting server..."
node dist/index.js
