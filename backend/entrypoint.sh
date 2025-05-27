#!/bin/sh
if [ "$DEV_MODE" = "true" ]; then
  echo "Starting in VS Code dev container mode..."
  tail -f /dev/null
else
  echo "Starting backend service..."
  npm run start
fi
