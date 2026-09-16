import type { ZodType } from "zod";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import * as contract from "./index";

type ContractSchemaName = {
  [K in keyof typeof contract]: (typeof contract)[K] extends ZodType ? K : never;
}[keyof typeof contract];

// Drafted locally until workstream 03 publishes these schemas from @kayu/schemas; at that
// point this becomes a LazyZodValidationPipe over `await import("@kayu/schemas")` by name.
export function contractPipe(name: ContractSchemaName) {
  return new ZodValidationPipe(contract[name] as ZodType);
}
