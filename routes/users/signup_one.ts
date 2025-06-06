import {Context, log} from "../../deps.ts";
import {getEvent} from "../../services/util.ts";
import {getClient} from "../../services/supabase.ts";

const LOG = log.getLogger("users");
const supabase = getClient()

export async function signupOne(ctx: Context) {
  const body = await ctx.request.body({ type: "json" }).value;
  let taskId;

  const response = new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        try {
          console.log(`You have successfully submitted ${JSON.stringify(body)}`)
          taskId = await insertAsyncTask(body)
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
            parentTaskId: body.taskId,
            taskId: taskId,
            status: "done"})
        } catch (error) {
          LOG.warning(`Error submitting the task ${body.id}: ${error}`);
          await updateAsyncTasks({
            parentTaskId: body.taskId,
            taskId: taskId,
            status: "error",
            error,
          })
        } finally {
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
      payload: {
        profile: payload.profile,
        userId: payload.userId,
      },
      parent_id: payload.taskId,
    })
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
  parentTaskId: string
  taskId: string
  status: string
  error?: string
}

const updateAsyncTasks = async (asyncTasks: AsyncTasksUpdate) => {
  const {error} = await supabase.from("async_tasks")
    .update({status: asyncTasks.status, errors: asyncTasks.error ? [asyncTasks.error] : undefined})
    .eq("id", asyncTasks.taskId)
  if(error) {
    throw new Error(error)
  }

  const {data, selectTasksError} = await supabase.from("async_tasks")
    .select()
    .eq("parent_id", asyncTasks.parentTaskId)
  if (selectTasksError) {
    throw new Error(selectTasksError)
  }
  console.log("found data ", data)
  if(data.every(task => task.status != "in progress")) {
    if(data.some(task => task.status === "error")) {
      const {error} = await supabase.from("async_tasks")
        .update({status: "error", errors: data.map(task => task.errors[0])})
        .eq("id", asyncTasks.parentTaskId)
      if(error) {
        throw new Error(error)
      }
    } else {
      const {error} = await supabase.from("async_tasks")
        .update({status: "done"})
        .eq("id", asyncTasks.parentTaskId)
      if(error) {
        throw new Error(error)
      }
    }
  }

  console.log("Updated task status")
}