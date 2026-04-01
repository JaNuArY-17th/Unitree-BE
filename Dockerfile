FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng Docker cache
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn và build
COPY . .
RUN npm run build

# Bước 2: Chạy ứng dụng (Runtime)
FROM node:20-alpine

WORKDIR /app

# Chỉ copy những thứ cần thiết từ bước build sang
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Copy cả folder prisma nếu Long dùng Prisma
COPY --from=builder /app/prisma ./prisma 

# Port mặc định của NestJS thường là 3000
EXPOSE 3000

CMD ["npm", "run", "start:prod"]