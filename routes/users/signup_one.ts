import {Context, log} from "../../deps.ts";
import {getEvent} from "../../services/util.ts";
import {getClient} from "../../services/supabase.ts";

const LOG = log.getLogger("users");
const supabase = getClient()

export async function signupOne(ctx: Context) {
  const body = await ctx.request.body({ type: "json" }).value;

  const response = new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        let taskId = "";
        try {
          console.log(`You have successfully submitted ${JSON.stringify(body)}`)
          taskId = await insertAsyncTask(body)
          const employee = await getEmployee(body.userId)
          console.log("Retrieved employee", employee)
          const userId = await createUser(employee.email)
          console.log("Created user", userId)
          await supabase.from("user_api")
            .insert({
              id: userId,
              email: employee.email,
              name: `${employee.first_name} ${employee.last_name}`,
              profile: body.profile})
          console.log("Created user api")
          await supabase.from("async_tasks").update({status: "done"}).eq("id", taskId)
          console.log("Updated task status")
        } catch (error) {
          LOG.warning(`Error submitting the task ${body.id}: ${error}`);
          await supabase.from("async_tasks").update({status: "error"}).eq("id", taskId)
        }
        finally {
          controller.enqueue(
            getEvent("done", `/users completed`),
          );
          controller.close()
        }
      })();
    },
  });

  ctx.response.headers.append("content-type", "application/x-ndjson");
  ctx.response.body = response;
}

const insertAsyncTask = async (payload) => {
  const {data, error} = await supabase.from("async_tasks")
    .insert({
      endpoint: "/users/signup_one",
      payload})
    .select("id")
  if(error) {
    throw new Error(error)
  }
  return data[0].id
}

const getEmployee = async (id) => {
  const {data, error} = await supabase.from("employees")
    .select("first_name, last_name, email")
    .eq("id", id)
  if (error) {
    throw new Error(error)
  }
  return data[0]
}

const createUser = async (email: string) => {
  const {data, error} = await supabase.auth.admin.createUser({
    email,
    email_confirm: true
  })
  if(error) {
    throw new Error(error)
  }
  return data.user.id
}