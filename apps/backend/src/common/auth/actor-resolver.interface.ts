import type { Actor, AuthContextUser } from "./types";

export interface IActorResolver {
  resolve(authUser: AuthContextUser): Promise<Actor>;
}

export const ACTOR_RESOLVER = Symbol("ACTOR_RESOLVER");
