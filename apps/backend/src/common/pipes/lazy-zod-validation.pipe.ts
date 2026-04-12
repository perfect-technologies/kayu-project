import type { PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

export class LazyZodValidationPipe implements PipeTransform {
  private schema?: Promise<ZodType>;

  constructor(private readonly loadSchema: () => Promise<ZodType>) {}

  async transform(value: unknown) {
    this.schema ??= this.loadSchema();
    return new ZodValidationPipe(await this.schema).transform(value);
  }
}
