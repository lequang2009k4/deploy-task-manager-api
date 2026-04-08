#!/bin/bash

# ==============================================================================
# AUTOMATED DOCKER DEPLOYMENT SCRIPT (DOCKER CLI ONLY)
# ==============================================================================

# 1. ROOT PRIVILEGE CHECK
if [[ $EUID -ne 0 ]]; then
   echo "Error: Please run this script with sudo (sudo ./deploy-docker.sh)"
   exit 1
fi
SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
PROJECT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

echo "--- 1. Initializing Docker Deployment ---"
echo "Project Root: $PROJECT_DIR"

# Move into the project root so 'docker build' can find the Dockerfile
cd "$PROJECT_DIR"

# 2. COLLECT CONFIGURATION
echo "------------------------------------------------"
read -p "1. Enter DynamoDB Table Name: " TABLE_NAME
read -p "2. Enter AWS Region (default ap-southeast-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-ap-southeast-1}
echo "------------------------------------------------"

# 3. BUILD THE IMAGE
# Using the optimized Dockerfile in your directory
echo "Building Docker image: task-api:latest..."
docker build -t task-api:latest .

# 4. CLEAN UP OLD CONTAINER
# If a container with the same name exists, we must remove it before starting a new one.
echo "Cleaning up old container (if any)..."
docker stop task-api-container 2>/dev/null
docker rm task-api-container 2>/dev/null

# 5. RUN THE CONTAINER
# Mapping all configurations directly into the docker run command
echo "Starting new container..."
docker run -d \
  --name task-api-container \
  --restart always \
  -p 3000:3000 \
  -e PORT=3000 \
  -e TABLE_NAME=$TABLE_NAME \
  -e AWS_REGION=$AWS_REGION \
  task-api:latest

# 6. VERIFICATION
echo "------------------------------------------------"
echo "DEPLOYMENT SUMMARY:"
if [ "$(docker ps -q -f name=task-api-container)" ]; then
    echo "- Status: SUCCESS"
    echo "- API is running on port 3000"
    echo "- Logs: sudo docker logs -f task-api-container"
else
    echo "- Status: FAILED"
fi
echo "------------------------------------------------"
