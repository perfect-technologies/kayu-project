import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { ZodError } from "zod";

@Injectable()
export class ZodValidationPipe<TSchema extends ZodType> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      message: "Validation failed",
      errors: this.formatError(result.error),
    });
  }

  private formatError(error: ZodError) {
    return error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
  }
}
