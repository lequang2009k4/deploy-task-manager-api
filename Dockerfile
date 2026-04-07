# ----- Stage 1: Build & Install -----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy only package files to leverage Layer Caching
COPY package*.json ./

# Install dependencies for production
RUN npm install --omit=dev

# Copy the entire codebase and build (if you have a transpile/build step)
COPY . .

# Remove unnecessary files and ensure only production dependencies remain
# This helps eliminate heavy test and dev libraries
#RUN npm prune --production


# ----- Stage 2: Production Runtime -----
FROM node:20-alpine AS runner

# Set Environment to Production
ENV NODE_ENV=production

WORKDIR /app

# Security: Do not run as root. Use the 'node' user provided in the alpine image
USER node 

# Only copy what is strictly necessary from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Metadata
EXPOSE 3000

# Run directly with node (avoid using 'npm start' to save resources and better manage OS signals)
CMD ["node", "src/app.js"]

