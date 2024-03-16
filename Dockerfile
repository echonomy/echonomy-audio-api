FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

RUN apk add --no-cache ffmpeg
RUN corepack enable pnpm

# Copy package.json and package-lock.json to the container
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm i

# Copy the rest of the application code to the container
COPY . .

RUN pnpm build

# Expose the port on which your Express app runs
EXPOSE 3000

# Command to run your Express app
CMD ["pnpm", "start"]