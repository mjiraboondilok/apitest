import { Router } from "../deps.ts";
import example from "./example/index.ts";
import tasks from "./tasks/index.ts";
import users from "./users/index.ts";

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
  .use("/users",
    users.routes(),
    users.allowedMethods())

export default router;
