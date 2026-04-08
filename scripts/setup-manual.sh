#!/bin/bash

# ==============================================================================
# AUTOMATED INSTALLATION AND SYSTEMD CONFIGURATION SCRIPT FOR TASK MANAGER API
# ==============================================================================

# 1. CHECK FOR ROOT PRIVILEGES
# Any operation involving system directories like /etc/systemd/ requires Admin (sudo) rights.
# $EUID is a Linux environment variable containing the current User ID (root ID = 0).
if [[ $EUID -ne 0 ]]; then
   echo "Error: Please run this script with sudo (sudo ./setup-manual.sh)"
   exit 1
fi

echo "--- 1. Starting system setup process ---"

# 2. INSTALL NODE.JS 20 (LTS)
# command -v node: Checks if the 'node' command already exists in the system PATH.
if ! [ -x "$(command -v node)" ]; then
    echo "Node.js not found. Proceeding to install version 20..."
    # Download the installation script from official NodeSource and execute via bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    # Install the nodejs package into the system
    apt install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

# 3. PREPARE PROJECT DIRECTORY
# $(pwd): Gets the absolute path of the current directory (where you are currently standing).
# This makes the script flexible; the app works regardless of where you clone the code.
PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
#${BASH_SOURCE[0]}: path to file script on running, BASH_SOURCE is array contain all scripts is excuting on "stack"
# dirname: folder contain script
# ..: cd out  1 level
echo "Working directory: $PROJECT_DIR"

# npm install --omit=dev: Only installs essential libraries (dependencies).
# Excludes test/dev tools (devDependencies) to save server disk space and keep it lean.
echo "Installing Node.js production dependencies..."
npm install --omit=dev

# 4. COLLECT USER CONFIGURATION
# read -p: Pauses the script to let the user input information from the keyboard.
echo "------------------------------------------------"
echo "Please enter AWS configuration details:"
read -p "1. Enter DynamoDB Table Name: " TABLE_NAME
read -p "2. Enter AWS Region (default ap-southeast-1): " AWS_REGION

# If the user leaves AWS_REGION blank, automatically use the default valuee Parameter Expansion ( ${VAR:-default} )
AWS_REGION=${AWS_REGION:-ap-southeast-1}
echo "------------------------------------------------"

# 5. CREATE SYSTEMD SERVICE FILE
# This is the control file that helps the App run in the background and auto-start with Ubuntu.
SERVICE_FILE="/etc/systemd/system/task-api.service"

echo "Creating service file at: $SERVICE_FILE"

# cat <<EOF: Writes the entire content between here and the 'EOF' tag into the destination file.
cat <<EOF > $SERVICE_FILE
[Unit]
#basic infor
Description=NodeJS Task Management API
After=network.target
#only run app when have succese network
[Service]
#config 

# Avoid running as 'root' for better security (Principle of Least Privilege).
User=$SUDO_USER
Group=$(id -gn $SUDO_USER)

# WorkingDirectory: The folder containing your src/ code.
WorkingDirectory=$PROJECT_DIR

# ExecStart: The main execution command to start the App.
ExecStart=/usr/bin/node src/app.js

# Environment: "Injects" environment variables into the application, app take thought process.env
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=TABLE_NAME=$TABLE_NAME
Environment=AWS_REGION=$AWS_REGION

# Restart Policy: 
# always: Restarts the app automatically if it crashes for any reason.
# RestartSec: Waits 5 seconds before restarting to prevent CPU spikes if the code loops an error.
Restart=always
RestartSec=5

[Install]
# multi-user.target: Allows the app to run when the server is in normal operating mode.
WantedBy=multi-user.target
EOF

# 6. ACTIVATE SERVICE
echo "Reloading configuration and activating service..."

# Reload the service list so the system recognizes the newly created file.
systemctl daemon-reload

# Enable: Allows the app to start automatically when the server reboots.
systemctl enable task-api

# Restart: Stops the old version (if any) and runs the new version with the updated config.
systemctl restart task-api

# 7. FINALIZE
echo "------------------------------------------------"
echo "DEPLOYMENT RESULTS:"
# is-active: Quickly checks if the app is 'active' (running) or 'inactive' (stopped).
echo "- Status: $(systemctl is-active task-api)"
# add \ when you want print $(systemctl is-active task-api)
echo "- View logs: sudo journalctl -u task-api -f"
echo "------------------------------------------------"
