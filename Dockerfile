FROM node:16-bullseye

WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

RUN npm install
COPY . .
CMD ["npm", "start"]
