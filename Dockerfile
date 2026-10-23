FROM node:20-bookworm-slim

# Required to compile better-sqlite3
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

# Keep the project's src/, server/, and public/ folders intact
COPY . .

RUN npm run build

ENV NODE_ENV=production
CMD ["npm", "start"]
