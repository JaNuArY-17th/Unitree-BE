# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Dùng npm ci để cài đặt chính xác version trong lock file
RUN npm ci 

COPY . .

# Nếu Long dùng Prisma, phải có dòng này TRƯỚC KHI build
RUN npx prisma generate 

RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Đảm bảo copy cả prisma nếu có
COPY --from=builder /app/prisma ./prisma 

EXPOSE 3000

# Lệnh này giúp kiểm tra xem file có tồn tại không trước khi chạy
CMD ["node", "dist/src/main"]