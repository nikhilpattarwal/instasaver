# Use official Node.js image as base
FROM node:22

# Install Python3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Upgrade pip
RUN pip3 install --upgrade pip

# Set working directory
WORKDIR /app

# Copy package files first to leverage caching
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm install

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Copy all other files
COPY . .

# Expose the port used by the app
EXPOSE 5000

# Start the Node.js server
CMD ["node", "index.js"]
