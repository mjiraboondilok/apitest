import {Context, log} from "../../deps.ts";
import {getEvent} from "../../services/util.ts";

const LOG = log.getLogger("users");

export async function signupOne(ctx: Context) {
  const body = await ctx.request.body({ type: "json" }).value;

  const response = new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        try {
          console.log(`You have successfully submitted ${JSON.stringify(body)}`)
        } catch (error) {
          LOG.warning(`Error submitting the task ${body.id}: ${error}`);
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