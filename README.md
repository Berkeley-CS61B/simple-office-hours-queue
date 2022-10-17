# Simple Office Hours Queue

## What?

SOHQ is an open-source office hours queue that allows students to sign up for office hours and instructors to manage the queue.

## Installation

For the `.env` setup, Refer to the `.env.example` file for the format of the required environment variables. The setup is as follows:

<details>
<summary>Ably</summary>

Ably is used for real-time communication (i.e. queue updates)

1. Create an account on <a target="_blank" href="https://ably.com">Ably</a>.

2. Create a new app.

3. You should have 2 API keys, one for the server (top) and one for the client (bottom). Copy the server API key and paste it into the `ABLY_SERVER_API_KEY` variable in the `.env` file. Copy the client API key and paste it into the `NEXT_PUBLIC_ABLY_CLIENT_API_KEY` variable in the `.env` file. Your client API key should have the `Subscribe` and `Publish` permission enabled.
![Ably API Keys](/readme-assets/ably-config.jpg)

</details>

<details>
<summary>Google OAuth</summary>

Google OAuth is used for authentication.

1. Create a new project on <a target="_blank" href="https://console.developers.google.com">Google Cloud Platform</a>.

2. Enable the Google OAuth API.

3. Create a new OAuth client ID. Make sure to set the redirect URI to `http://localhost:3000/api/auth/callback/google`.

4. Copy the client ID and paste it into the `GOOGLE_CLIENT_ID` variable in the `.env` file.

5. Copy the client secret and paste it into the `GOOGLE_CLIENT_SECRET` variable in the `.env` file.

</details>

<details>
<summary>Database</summary>

SOHQ uses MySQL as its database, mainly because the free tier of <a href="https://planetscale.com">Planetscale</a> is very nice. For local development, I am currently looking into possibly using Docker to have a local MySQL instance.

1. Create a new database on <a target="_blank" href="https://planetscale.com">Planetscale</a>.

2. Copy the database URL and paste it into the `DATABASE_URL` variable in the `.env` file. You can find this link by clicking on the database name and then clicking on the `Connect` button and select `Connect with Prisma`.

</details>

<br />


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

If you'd like to contribute, please make a pull request. If you have any questions, feel free to open an issue.
