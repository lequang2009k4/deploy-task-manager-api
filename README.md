# Serverless Task Management API Deployment Guide

This repository provides automated scripts to deploy the Task Management API on an Ubuntu server. Users can choose between two primary deployment methods: Manual (Systemd) or Containerized (Docker).

---

## Prerequisites

Regardless of the chosen method, ensure the following requirements are met:
1. IAM Role: The EC2 instance must be attached to an IAM Role with AmazonDynamoDBFullAccess permissions.
2. Security Group: Ensure Port 3000 is open in your AWS Security Group to allow inbound traffic.
3. Source Code:
   Clone the repository and navigate to the root directory:
   ```
   git clone https://github.com/lequang2009k4/deploy-task-manager-api.git
   cd deploy-task-manager-api
   ```
---

## Method 1: Manual Deployment (Systemd)

This method is suitable for running the application directly on the Ubuntu host operating system without virtualization.

### Execution Steps:
1. Grant execution permissions to the script:
   chmod +x scripts/setup-manual.sh

2. Execute the script with sudo privileges:
   sudo bash scripts/setup-manual.sh

3. Configuration: The script will automatically install Node.js 20, set up production dependencies, and prompt you to enter your DynamoDB Table Name and AWS Region.

### Service Management:
- Check Service Status: sudo systemctl status task-api
- View Live Logs: sudo journalctl -u task-api -f
- Restart Service: sudo systemctl restart task-api

---

## Method 2: Containerized Deployment (Docker)

This is the recommended method for ensuring a consistent environment, high security, and automated log management.

### Execution Steps:
1. Prerequisites: Ensure Docker are installed on the host.

2. Grant execution permissions to the script:
   chmod +x scripts/setup-container.sh

3. Execute the script with sudo privileges:
   sudo bash scripts/setup-container.sh

4. Configuration: Enter the DynamoDB Table Name when prompted. The script will build an optimized image using the multi-stage Dockerfile and start the container.

### Container Management:
- List Running Containers: sudo docker ps
- View Container Logs: sudo docker logs -f task-api-container
- Stop Application: sudo docker stop task-api-container
- Remove Application: sudo docker rm -f task-api-container

---

