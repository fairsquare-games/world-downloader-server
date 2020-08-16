FROM node:12.16.3

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Build / transpile app
RUN npm run build

# Remove unused files and directories
RUN rm -rf src .gitignore .prettierrc nodemon.json tsconfig.json
RUN npm prune --production

ENV NODE_ENV=production
CMD [ "npm", "start" ]
