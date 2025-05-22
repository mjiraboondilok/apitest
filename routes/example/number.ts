import { Context, log } from "../../deps.ts";
import { getEvent } from "../../services/util.ts";
import { validExamplePayload } from "../../services/validator.ts";

const LOG = log.getLogger("example");

export async function number(ctx: Context) {

    const body = await ctx.request.body({ type: "json" }).value;

    if (!validExamplePayload(body)) {
        console.log(`Invalid payload at /example: ${JSON.stringify(body)}`)
        return;
    }

    const response = new ReadableStream<Uint8Array>({
        start(controller) {
            (async () => {
                try {
                    console.log(`You have successfully submitted the number ${body.number}`)
                } catch (error) {
                    LOG.warning(`Error submitting the number ${body.number}: ${error}`);
                }
                finally {
                    controller.enqueue(
                        getEvent("done", `/example completed`),
                    );
                    controller.close()
                }
            })();
        },
    });

    ctx.response.headers.append("content-type", "application/x-ndjson");
    ctx.response.body = response;
}

