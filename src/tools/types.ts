import type Inconvo from "@inconvoai/node";

export type InconvoUserContext = Record<string, unknown>;

export type UserContextProvider =
  | InconvoUserContext
  | Promise<InconvoUserContext>
  | (() => Promise<InconvoUserContext> | InconvoUserContext);

export type SerializeResponse = (response: unknown) => string;

export interface InconvoToolsOptions {
  inconvo?: Inconvo;
  agentId: string;
  userIdentifier?: string;
  userContext?: UserContextProvider;
  messageDescription?: string;
  stringifyResponse?: SerializeResponse;
  name?: string;
}
