import { Router } from "../../deps.ts";
import { signupAll } from "./signup_all.ts";
import { signupOne } from "./signup_one.ts";

// setup the routing
const router = new Router()
  .post("/signup_all", signupAll)
  .post("/signup_one", signupOne)

export default router;
