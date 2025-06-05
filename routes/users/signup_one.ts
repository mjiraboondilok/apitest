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
        try {
          console.log(`You have successfully submitted ${JSON.stringify(body)}`)
          const employee = await getEmployee(body.userId)
          const userId = await createUser(employee.email)
          await insertUserApi({
            userId,
            email: employee.email,
            first_name: employee.first_name,
            last_name: employee. last_name,
            profile: body.profile
          })
          await updateAsyncTasks({
            taskId: body.taskId,
            status: "done"})
        } catch (error) {
          LOG.warning(`Error submitting the task ${body.id}: ${error}`);
          await updateAsyncTasks({
            taskId: body.taskId,
            status: "error"})        }
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
  console.log("Retrieved employee", data[0])
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
  console.log("Created user", data.user.id)
  return data.user.id
}

type UserApiInsert = {
  userId: string
  email: string
  first_name: string
  last_name: string
  profile: string
}

const insertUserApi = async (userApi: UserApiInsert) => {
  const {error} = await supabase.from("user_api")
    .insert({
      id: userApi.userId,
      email: userApi.email,
      name: `${userApi.first_name} ${userApi.last_name}`,
      profile: userApi.profile})
  if(error) {
    throw new Error(error)
  }
  console.log("Created user api")
}

type AsyncTasksUpdate = {
  taskId: string
  status: string
}

const updateAsyncTasks = async (asyncTasks: AsyncTasksUpdate) => {
  const {error} = await supabase.from("async_tasks").update({status: asyncTasks.status}).eq("id", asyncTasks.taskId)
  if(error) {
    throw new Error(error)
  }
  console.log("Updated task status")
}