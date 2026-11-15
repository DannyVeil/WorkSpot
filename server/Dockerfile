FROM node:22-alpine

WORKDIR /app

# Зависимости отдельным слоем — лучше кешируется
COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node src ./src

ENV NODE_ENV=production
EXPOSE 4000

USER node

CMD ["node", "src/index.js"]
