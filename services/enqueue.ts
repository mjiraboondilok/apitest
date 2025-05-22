import {
  ky,
  log,
} from "../deps.ts";

export async function enqueue(
  url: string,
  body: unknown,
  delayInSeconds?: number,
) {
  url = `${Deno.env.get("APP_URL")}${url}`;

  try {
    // assuming that all background apis are post
    const res = await ky.post(url, {
      json: body,
      timeout: false,
    });

    return res.text();
  } catch (e) {
    console.error(e);
  }
}