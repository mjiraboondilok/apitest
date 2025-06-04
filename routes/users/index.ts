import { Router } from "../../deps.ts";
import { signupAll } from "./signup_all.ts";

// setup the routing
const router = new Router()
  .post("/signup_all", signupAll)

export default router;
