# apitest

apitest is a rest api backend for background jobs and other uses using the
Deno runtime and Oak framework.

## Prerequisites

- Make sure you have
  [Deno](https://deno.land/manual@v1.29.1/getting_started/installation)
  installed for development

## Development

- Set these in your `.env` file:
  ```
  SUPABASE_URL="http://host.docker.internal:64321"
  SUPABASE_SERVICE_KEY="..."
  APP_URL="http://localhost:8080"
  ```

- Set this in your `.env.local` file in uitest:
  ```
  COMASYNC_URL='http://localhost:8080'
  ```
- Run using `docker-compose up --build`

