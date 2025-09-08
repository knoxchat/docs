FROM node:20-alpine AS build

WORKDIR /app

# Enable Corepack to use the correct Yarn version
RUN corepack enable && corepack prepare yarn@3.6.3 --activate

# Copy package.json and yarn.lock files first
COPY package.json yarn.lock .yarnrc.yml* ./

# Initialize Yarn 3 (will create .yarn directory)
RUN yarn set version 3.6.3

# Install dependencies (without --immutable)
RUN yarn install

# Copy the rest of the application code
COPY . .

# Reinstall dependencies if needed (e.g., for workspace setups)
RUN yarn install

# Build the Docusaurus site
RUN yarn build

# Expose port 3000 (Docusaurus default)
EXPOSE 3000

# Command to serve the static site
CMD ["yarn", "serve", "--port", "3000", "--host", "0.0.0.0"]