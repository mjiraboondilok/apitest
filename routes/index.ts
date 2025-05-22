import { Router } from "../deps.ts";
import example from "./example/index.ts";

// setup the routing
const router = new Router()
  .use(
    "/example",
    example.routes(),
    example.allowedMethods(),
  )

export default router;
