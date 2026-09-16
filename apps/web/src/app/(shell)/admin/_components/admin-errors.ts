import { ApiError } from "@kayu/api";
import { adminCopy } from "@/copy/admin";
import { errorMessage } from "@/copy/errors";

type ErrorBody = {
  counts?: Record<string, number>;
  missingKinds?: string[];
  errors?: Array<{ path?: string; message?: string }>;
};

/** The server's own French message when it has one, with the REFERENCED counts and DOCS_MISSING kinds appended. */
export function adminErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return errorMessage(error);
  const body = (error.body ?? undefined) as ErrorBody | undefined;
  if (error.status === 400 && body?.errors?.length) {
    const first = body.errors[0];
    return first.path ? `${first.path} : ${first.message}` : (first.message ?? errorMessage(error));
  }
  if (!error.code) return errorMessage(error);
  const base = error.message || errorMessage(error);
  if (error.code === "REFERENCED" && body?.counts) {
    const counts = adminCopy.errors.referencedCounts(body.counts);
    return counts ? `${base} ${counts}` : base;
  }
  if (error.code === "DOCS_MISSING" && body?.missingKinds?.length) {
    return `${base} ${adminCopy.errors.missingDocs(body.missingKinds)}`;
  }
  return base;
}
