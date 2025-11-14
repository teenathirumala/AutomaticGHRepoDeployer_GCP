FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY index.js ./

# Expose ports
EXPOSE 9000 9002

# Start the application
CMD ["node", "index.js"]

