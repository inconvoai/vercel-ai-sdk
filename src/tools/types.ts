import type Inconvo from "@inconvoai/node";
import type { ResponseCompletedEvent } from "@inconvoai/node";

export type InconvoUserContext = Record<string, unknown>;

export type UserContextProvider =
  | InconvoUserContext
  | Promise<InconvoUserContext>
  | (() => Promise<InconvoUserContext> | InconvoUserContext);

// Extract the response type from ResponseCompletedEvent
export type InconvoResponse = ResponseCompletedEvent["response"];

export type SerializeResponse = (response: unknown) => InconvoResponse;

export interface InconvoToolsOptions {
  inconvo?: Inconvo;
  agentId: string;
  userIdentifier?: string;
  userContext?: UserContextProvider;
  messageDescription?: string;
  stringifyResponse?: SerializeResponse;
  name?: string;
}
