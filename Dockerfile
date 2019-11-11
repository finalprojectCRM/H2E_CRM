FROM node:alpine

COPY package.json package.json
RUN npm install
RUN apk add curl 

COPY . .

EXPOSE 7000
CMD ["npm", "start"]


