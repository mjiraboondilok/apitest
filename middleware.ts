import {
  Context,
  isHttpError,
  log,
  Request,
  Response,
  Status,
} from "./deps.ts";

class SimpleConsoleHandler extends log.handlers.BaseHandler {
  override log(msg: string) {
    console.log(msg);
  }
}

const DEFAULT_LOGGER: log.LoggerConfig = {
  level: "INFO",
  handlers: ["console"],
};

log.setup({
  // define handlers
  handlers: {
    console: Deno.env.get("SKIP_JSON_LOGGING")
      ? new log.handlers.ConsoleHandler("DEBUG", {
        formatter: (rec) =>
          `${rec.levelName} ${rec.loggerName} ${rec.msg} - ${rec.args && rec.args.length &&
          JSON.stringify(rec.args[0], undefined, 2)
          }`,
      })
      : new SimpleConsoleHandler("DEBUG", {
        formatter: (rec) => {
          const req: Request | undefined = rec.args.length
            ? (rec.args[0] as Record<string, unknown>).request as Request
            : undefined;
          const res: Response | undefined = rec.args.length
            ? (rec.args[0] as Record<string, unknown>).response as Response
            : undefined;

          const err: Error | undefined = rec.args.length
            ? (rec.args[0] as Record<string, unknown>).error as Error
            : undefined;

          return JSON.stringify({
            severity: rec.levelName,
            message: rec.msg,
            info: rec.levelName === "INFO" ? rec.args[0] : undefined,
            errorInfo: rec.levelName === "ERROR" ? rec.args[0] : undefined,
            debug: rec.levelName === "DEBUG" ? rec.args[0] : undefined,
            time: rec.datetime.toISOString(),
            "logging.googleapis.com/labels": {
              name: rec.loggerName,
            },
            httpRequest: {
              requestMethod: req?.method,
              requestUrl: req?.url,
              status: res?.status,
            },
            error: {
              message: err?.message,
              stack: err?.stack,
            },
          });
        },
      }),
  },

  // assign handlers to loggers
  loggers: {
    main: DEFAULT_LOGGER,
    middleware: DEFAULT_LOGGER,
    sync: DEFAULT_LOGGER,
    diff: DEFAULT_LOGGER,
    "jobs": DEFAULT_LOGGER,
    "user/signup-all": DEFAULT_LOGGER,
    "user/signup": DEFAULT_LOGGER,
    "example/number": DEFAULT_LOGGER,
  },
});

const LOG = log.getLogger("middleware");

export async function logger(ctx: Context, next: () => Promise<unknown>) {
  try {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    LOG.info(
      `${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} - ${rt}`,
      { request: ctx.request, response: ctx.response },
    );
  } catch (err) {
    if (isHttpError(err)) {
      ctx.response.status = err.status;
      switch (err.status) {
        case Status.NotFound:
          ctx.response.body = "Not Found";
          break;
        default:
          ctx.response.body = "Internal Server Error";
      }
    } else {
      // rethrow if you can't handle the error
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = "Internal Server Error";
    }

    LOG.error(
      `${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} - ${err.message}`,
      { request: ctx.request, response: ctx.response, error: err },
    );
  }
}

export async function timing(ctx: Context, next: () => Promise<unknown>) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
}
