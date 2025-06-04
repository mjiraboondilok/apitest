import { Router } from "../../deps.ts";
import { trigger } from "./trigger.ts";

// setup the routing
const router = new Router()
  .post("/trigger", trigger)

export default router;
