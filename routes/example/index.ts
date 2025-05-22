import { Router } from "../../deps.ts";
import { number } from "./number.ts";

// setup the routing
const router = new Router()
    .post("/number", number)

export default router;
