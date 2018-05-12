FROM node:latest
WORKDIR /usr/src/http-log-console
COPY package*.json ./
RUN npm install
COPY . .
# CMD [ "npm", "start" ]
CMD [ "bash" ]