function enabled(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

export const launchFlags = {
  enableJobRequests: enabled(process.env.NEXT_PUBLIC_ENABLE_JOB_REQUESTS),
  enableQuoteMarketplace: enabled(process.env.NEXT_PUBLIC_ENABLE_QUOTE_MARKETPLACE),
} as const;

