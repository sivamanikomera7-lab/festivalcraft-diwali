FROM node:20-bookworm-slim

# Build tools required by better-sqlite3's native module
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

# Copy the complete project, preserving folders such as src/, public/, and server/
COPY . .

RUN npm run build

ENV NODE_ENV=production

# Render supplies PORT automatically; server/index.js reads process.env.PORT
CMD ["npm", "start"]
