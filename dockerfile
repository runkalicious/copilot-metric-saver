# Use the official Node.js image as the base image
FROM node:20.15.0

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install specific versions of TypeScript and ts-node globally
RUN npm install -g typescript@5.5.4 ts-node@10.9.2


# Copy node_modules directory
#COPY node_modules ./node_modules

# Copy the rest of the project files
COPY . .

# create a new folder named data
# Create a new folder named data and set permissions
RUN mkdir -p /app/data && chmod -R 777 /app/data


# Expose the application port
EXPOSE 3000

# Start the application
ENTRYPOINT ["ts-node", "src/server.ts"]