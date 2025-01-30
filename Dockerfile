# Install dependencies only when needed
FROM node:18.17-alpine AS deps
USER root
RUN apk update && apk upgrade
RUN apk add --no-cache openssl
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY prisma ./

COPY package.json package-lock.json ./
RUN npm ci --production

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

#FROM node:18-alpine as debug
USER root
RUN apk add openssl
RUN openssl version
RUN echo "openSSL version:" && openssl version
RUN npx prisma generate

ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true
#FROM node:18-alpine as next
#WORKDIR /app
# Build the Next.js application
RUN npm run build

# Production image, copy all the files and start the app
FROM node:18.17-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# think above shold be changed but yolo
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files for production
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules


#COPY prisma /app/prisma/
#RUN npx prisma generate


COPY . /app

#RUN chmod 777 /app/wait-for-it.sh
#RUN chmod 777 /app/start.sh
RUN chmod 777 -R /app


USER nextjs

EXPOSE 3000
ENV PORT 3000

#ENTRYPOINT ["./start.sh"]
#RUN npx prisma db push --debug --accept-data-loss
RUN npx prisma db push --accept-data-loss
#RUN npx prisma db seed
CMD ["npm", "start"]