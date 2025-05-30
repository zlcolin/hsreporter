FROM node:18-alpine AS build

# 创建新用户
RUN adduser -D appuser

WORKDIR /app

# 以 root 用户复制文件
COPY package*.json ./

# 以 root 用户安装依赖
RUN npm install --omit=dev

# 切换到新用户
USER appuser

COPY . .

# 切换回 root 用户
USER root
# 提前创建 dist 目录并设置权限
RUN mkdir -p /app/dist && chown -R appuser:appuser /app/dist
# 确保 appuser 对 node_modules 目录及其子目录有读写权限
RUN chown -R appuser:appuser /app/node_modules
# 确保 vue-tsc 和 vite 有执行权限
RUN chmod +x ./node_modules/.bin/vue-tsc ./node_modules/.bin/vite
# 切换回 appuser
USER appuser

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
