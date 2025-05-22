import { z } from "../deps.ts";

export const exampleSchema = z.object({ number: z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) })

function createValidationFunction(schema) {
  return (value: unknown): value is z.infer<typeof schema> => schema.safeParse(value).success;
}

export const validExamplePayload = createValidationFunction(exampleSchema);