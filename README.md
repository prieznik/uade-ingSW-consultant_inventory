📦 Inventory App – AWS Deployment
Introduction

This project is a Node.js application for basic inventory management.
As part of the AWS Academy lab, different deployment approaches were tested: manual on EC2, automated with user data, Elastic Beanstalk, and using AWS CLI.

The goal was to show the client different deployment alternatives, their advantages, and limitations.

🚀 Requirements

Node.js 18.x

npm

Git

MySQL or PostgreSQL (for production database)

📖 1.a – Manual Deployment on EC2

Launch an EC2 instance with Ubuntu.

Connect via SSH and update packages:

sudo apt update -y
sudo apt upgrade -y


Install dependencies:

sudo apt install -y git nodejs npm


Clone the repository:

git clone https://github.com/josecastineiras/inventory.git
cd inventory
npm install


Start the application:

node server.js


Configure the Security Group to open port 3001.

Access the app in your browser:

http://<Public-IP>:3001

📖 1.b – Deployment with User Data

Launch an EC2 instance with Ubuntu.

In Advanced details → User data, add:

#!/bin/bash
apt update -y
apt upgrade -y
apt install -y git nodejs npm
cd /home/ubuntu
git clone https://github.com/josecastineiras/inventory.git
cd inventory
npm install
nohup node server.js > output.log 2>&1 &


Open port 3001 in the Security Group.

When the instance starts, the app will be available at:

http://<Public-IP>:3001

📖 2 – Deployment with AWS CLI

Install and configure AWS CLI:

aws configure


Create a setup.sh file:

#!/bin/bash
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
cd /home/ubuntu
git clone https://github.com/josecastineiras/inventory.git
cd inventory
npm install
nohup node server.js > output.log 2>&1 &


Launch the instance:

aws ec2 run-instances \
--image-id ami-08c40ec9ead489470 \
--count 1 \
--instance-type t2.micro \
--key-name vockey \
--security-group-ids sg-0fc12526a5a00a8a7 \
--subnet-id subnet-094595c35338606a2 \
--user-data file://setup.sh


Get the public IP:

aws ec2 describe-instances \
--query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
--output table


Access the app in your browser:

http://<Public-IP>:3001

📖 3 – Deployment with Elastic Beanstalk
Prepare the code for EB

Go to the inventory folder.

In package.json, ensure you have:

"scripts": {
  "start": "node server.js"
}


Create a new file named Procfile (no extension) with:

web: node server.js

Create the correct ZIP

Inside the inventory folder, select all files (server.js, package.json, routes/, etc.) plus the Procfile.

Right-click → Compress to ZIP.

Name it inventory.zip.
⚠️ Make sure files are in the root of the ZIP, not inside a subfolder.

Create the Elastic Beanstalk Application

Go to Elastic Beanstalk in AWS Console.

Click Create Application.

Application name: consultant-inventory-3

Environment tier: Web server environment

Environment name: consultant-inventory-3-env

Domain: use the suggested one or check availability

Configure the platform

Platform: Node.js

Branch: Node 18 or 22 (recommended)

Version label: v1

Upload your inventory.zip

Configure security

Service role: LabRole

Instance profile: LabInstanceProfile

EC2 Key Pair: vockey

Configure networking

VPC: default (vpc-0ced9f428e4bae8cc)

Public IP: enabled

Subnet: e.g., subnet-094595c35338606a2

Database: disabled

Configure capacity

Environment type: Single instance

Instance type: t3.micro

Architecture: x86_64

Monitoring and updates

Health reporting: Basic

Managed platform updates: disabled

Deployment policy: All at once

Create the environment

Review settings → Create environment.

EB will provision resources and deploy the app.

Test the app

Once ready, EB provides a public URL like:

http://consultant-inventory-3-env.us-east-1.elasticbeanstalk.com


Open it in your browser and confirm the app loads.

📌 Next steps (Exercise 4)

Update the app to run on port 80.

Migrate the database from SQLite → MySQL or PostgreSQL.

Push the updated project to your own GitHub repository.
