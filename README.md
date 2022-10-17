# Simple Office Hours Queue

## What?

SOHQ is an open-source office hours queue that allows students to sign up for office hours and instructors to manage the queue.

## Installation
`.env` setup:
Refer to the .env.example file for the required environment variables.

<!-- Add a toggle that says "Ably" -->
### Ably
1. Create an account on [Ably](https://ably.com/).
2. Create a new app.
3. You should have 2 API keys, one for the server (top) and one for the client (bottom). Copy the server API key and paste it into the `ABLY_SERVER_API_KEY` variable in the `.env` file. Copy the client API key and paste it into the `NEXT_PUBLIC_ABLY_CLIENT_API_KEY` variable in the `.env` file. Your client API key should have the `Subscribe` and `Publish` permission enabled.
![Ably API Keys](/readme-assets/ably-config.jpg)

After your `.env` file is setup, run the following commands to install dependencies and start the server:

```bash
npm install
npm run build
npm run start
```

If you want to run the server in development mode, run the following commands:

```bash
npm install
npm run dev
```

## Tech Stack

This project is built using the [T3 stack](https://github.com/t3-oss/create-t3-app), specifically these aspects:
- [Next-Auth.js](https://next-auth.js.org) for authentication (Google)
- [Prisma](https://prisma.io) for database management
- [tRPC](https://trpc.io) for API management
- [Chakra UI](https://chakra-ui.com) for UI components
- [MySQL](https://mysql.com) for database
- [Ably](https://ably.com) for real-time updates

## Contributing
TODO