import { createGateway, type LanguageModel, type SystemModelMessage } from "ai";

type ProviderOptions = NonNullable<SystemModelMessage["providerOptions"]>;

export const DEFAULT_AGENT_MODEL_ID = "anthropic/claude-opus-5";

// The gateway model id: the RFC build model unless AGENT_MODEL_ID overrides it (an id from the gateway catalog).
export function agentModelId(): string {
  return process.env.AGENT_MODEL_ID?.trim() || DEFAULT_AGENT_MODEL_ID;
}

let cached: { id: string; model: LanguageModel } | undefined;

// Created on first use: ConfigModule loads apps/backend/.env after this file is imported.
export function agentModel(): LanguageModel {
  const id = agentModelId();
  if (!cached || cached.id !== id) {
    cached = { id, model: createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })(id) };
  }
  return cached.model;
}

export const cachedSystemProviderOptions: ProviderOptions = {
  anthropic: { cacheControl: { type: "ephemeral" } },
};

export const agentCallProviderOptions: ProviderOptions = {
  anthropic: { thinking: { type: "adaptive" } },
};
