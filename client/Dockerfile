FROM node:22-alpine AS build

WORKDIR /app

COPY . .

RUN corepack enable
RUN pnpm install --frozen-lockfile

RUN pnpm build


FROM nginx:alpine

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY --from=build /app/client/config.json /usr/share/nginx/html/config.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]