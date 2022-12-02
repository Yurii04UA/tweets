FROM node:16.13.2

WORKDIR /appClient

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]