#!/bin/bash

# Fix Docker permissions
echo "Fixing Docker permissions..."

# Add current user to docker group
sudo usermod -aG docker $USER

# Change docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Restart docker service
sudo systemctl restart docker

echo "Docker permissions fixed!"
echo "Please log out and log back in, or run: newgrp docker"
echo "Then try: docker ps"