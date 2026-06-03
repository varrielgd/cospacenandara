# Use Node.js 22 as base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
