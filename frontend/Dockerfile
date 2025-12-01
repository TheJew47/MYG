# 1. Base Image (Node.js for Next.js)
FROM node:18-alpine

# 2. Set Working Directory
WORKDIR /app

# 3. Copy Dependency Files
COPY package.json package-lock.json* ./

# 4. Install Dependencies
RUN npm install

# 5. Copy Source Code
COPY . .

# 6. Expose Port
EXPOSE 3000

# 7. Start Command (Dev Mode)
CMD ["npm", "run", "dev"]