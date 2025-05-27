FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Accept build-time ARG
ARG DEV_MODE=false
ENV DEV_MODE=$DEV_MODE

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app
COPY . .

# Add entrypoint logic
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5173
ENTRYPOINT ["/entrypoint.sh"]