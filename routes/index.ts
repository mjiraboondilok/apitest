import { Router } from "../deps.ts";
import example from "./example/index.ts";
import tasks from "./tasks/index.ts";

// setup the routing
const router = new Router()
  .use(
    "/example",
    example.routes(),
    example.allowedMethods(),
  )
  .use("/tasks",
    tasks.routes(),
    tasks.allowedMethods())

export default router;
