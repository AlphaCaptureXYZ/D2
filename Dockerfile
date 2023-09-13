FROM node:18.16.0

RUN echo "Europe/London" > /etc/timezone

WORKDIR /usr/src/app

COPY "/package.json" "./package.json"
COPY "/package-lock.json" "./package-lock.json"

RUN apt-get update && apt-get install

RUN npm install tailwindcss@3.3.3 --force -g

RUN npm install --force

COPY . .

RUN npm run build

EXPOSE 4200
CMD ["npm", "run", "server"]




