FROM python:3.11-slim

# Install curl, Node.js, and python3-venv
RUN apt-get update && apt-get install -y curl python3-venv \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

COPY . .

# Setup Python virtual environment
RUN python3 -m venv venv
RUN ./venv/bin/pip install --upgrade pip
RUN ./venv/bin/pip install -r requirements.txt

# Install Node.js dependencies
RUN npm install

EXPOSE 5000

CMD ["node", "index.js"]
