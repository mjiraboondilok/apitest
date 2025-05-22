export function getEvent(
  type: "info" | "start" | "progress" | "done" | "warn" | "error",
  object: string,
  message?: string,
) {
  return new TextEncoder().encode(
    JSON.stringify({ ts: new Date().toISOString(), type, object, message }) +
    "\n",
  );
}