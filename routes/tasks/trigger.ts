import { Context, log } from "../../deps.ts";
import {getEvent} from "../../services/util.ts";
import {getClient} from "../../services/supabase.ts";
import {Database} from "../../types/supabase.ts";
import {enqueue} from "../../services/enqueue.ts";

const LOG = log.getLogger("tasks");

export type AsyncTask = Database['public']['Tables']['async_tasks']['Row']

export async function trigger(ctx: Context) {
  const supabase = getClient()
  const body = await ctx.request.body({ type: "json" }).value;

  const response = new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        try {
          console.log(`You have successfully submitted the task ${body.id}`)
          const {data} = await supabase.from("async_tasks")
            .select("payload").returns<AsyncTask[]>()
            .eq("id", body.id)
          await enqueue("/users/signup_all", {taskId: body.id, ...data[0].payload})
        } catch (error) {
          LOG.warning(`Error submitting the task ${body.id}: ${error}`);
        }
        finally {
          controller.enqueue(
            getEvent("done", `/tasks completed`),
          );
          controller.close()
        }
      })();
    },
  });

  ctx.response.headers.append("content-type", "application/x-ndjson");
  ctx.response.body = response;
}