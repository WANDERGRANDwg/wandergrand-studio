FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js ./
ENV PORT=8080
ENV MAX_PLAYERS=32
ENV DATA_FILE=/app/data/server-data.json
EXPOSE 8080
CMD ["node", "server.js"]
