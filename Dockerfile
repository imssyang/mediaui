FROM node:hydrogen-buster-slim

WORKDIR /opt/formatui

COPY package.json rollup.config.js ./
COPY src ./src

RUN npm install
RUN npm run build

CMD ["npm", "run", "serve"]
