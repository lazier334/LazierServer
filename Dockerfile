# 使用 Node.js 24 Alpine 版本
FROM node:24-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

EXPOSE 3000
EXPOSE 3001
EXPOSE 3010
EXPOSE 3011
CMD ["npm", "run", "start"]