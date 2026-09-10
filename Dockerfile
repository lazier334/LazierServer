# 使用 Node.js 24 Alpine 版本
FROM node:24-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm install -g .

WORKDIR /ls

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

EXPOSE 3344
EXPOSE 3345
ENTRYPOINT ["ls334"]