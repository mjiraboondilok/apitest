import {Context, log} from "../../deps.ts";
import {getEvent} from "../../services/util.ts";
import {enqueue} from "../../services/enqueue.ts";
import {getClient} from "../../services/supabase.ts";

const LOG = log.getLogger("users");
const supabase = getClient()

export async function signupAll(ctx: Context) {
  const body = await ctx.request.body({ type: "json" }).value;

  const response = new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        try {
          console.log(`You have successfully submitted ${JSON.stringify(body)}`)
          const signupPromises = []
          for (const userId of body.userIds) {
            signupPromises.push(enqueue("/users/signup_one", {taskId: body.taskId, userId, profile: body.profile}))
          }
          await Promise.all(signupPromises)
        } catch (error) {
          LOG.warning(`Error submitting the task ${body.taskId}: ${error}`);
          await supabase.from("async_tasks").update({status: "error"}).eq("id", body.taskId)
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