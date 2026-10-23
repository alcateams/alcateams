# backend

To install dependencies:

```bash
npm install
```

To configure the environment (then fill in the Rainbow variables):

```bash
cp .env.example .env
```

To start the local database (PostgreSQL on port 5432, pgAdmin on http://localhost:5050):

```bash
npm run docker:env
```

To apply migrations:

```bash
npx prisma migrate dev
```

To run:

```bash
npm run dev
```
