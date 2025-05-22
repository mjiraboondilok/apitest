import { Application, log } from "./deps.ts";
import { logger, timing } from "./middleware.ts";
import router from "./routes/index.ts";
// import { verifier } from "./services/upstash.ts";

const app = new Application();

// setup the default middlewares
app.use(logger);
app.use(timing);

// verify qstash signature
// app.use(verifier()); move qstash signature to each specific route in index.ts

// setup the routing
app.use(router.routes());
app.use(router.allowedMethods());

// 404 handler
app.use((ctx) => ctx.throw(404));

// setup the server
const PORT = +(Deno.env.get("PORT") || 8080);

app.addEventListener("error", (evt) => {
  log.getLogger("main").error(evt.error);
});

app.addEventListener("listen", ({ hostname, port, secure }) => {
  log.getLogger("main").info(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ?? "localhost"
    }:${port}`,
  );
});

// start the server
await app.listen({ port: PORT });
