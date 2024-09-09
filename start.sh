./wait-for-it.sh mariadb:3306 -- npx prisma db push
npx prisma db seed
npm start