import Inconvo from "@inconvoai/node";
import { tool } from "ai";
import { z } from "zod";
import { defaultMessageDataAgentDescription } from "./constants.js";
import type { InconvoToolsOptions, SerializeResponse } from "./types.js";

const ensureSerializer = (serialize?: SerializeResponse): SerializeResponse => {
  if (serialize) {
    return serialize;
  }
  return (value: unknown) =>
    typeof value === "string" ? value : JSON.stringify(value ?? null);
};

/**
 * Get a high-level summary of the connected data
 */
export const getDataAgentConnectedDataSummary = (
  options: InconvoToolsOptions,
) => {
  const { inconvo: providedInconvo, agentId } = options;

  if (!agentId) {
    throw new Error(
      "getDataAgentConnectedDataSummary requires an agentId value.",
    );
  }

  const inconvo = providedInconvo ?? new Inconvo();

  return tool({
    description:
      "Use this tool before you ask your first question. You will get a high level summary of the connected data. This can be used to get an overview of the data before asking more specific questions.",
    inputSchema: z.object({}),
    execute: async () => {
      const { dataSummary } =
        await inconvo.agents.dataSummary.retrieve(agentId);
      return dataSummary;
    },
  });
};

/**
 * Start a new conversation with the Inconvo data analyst
 */
export const startDataAgentConversation = (options: InconvoToolsOptions) => {
  const {
    inconvo: providedInconvo,
    agentId,
    userIdentifier,
    userContext,
  } = options;

  if (!agentId) {
    throw new Error("startDataAgentConversation requires an agentId value.");
  }

  if (!userIdentifier) {
    throw new Error(
      "startDataAgentConversation requires a userIdentifier value.",
    );
  }

  if (!userContext) {
    throw new Error("startDataAgentConversation requires a userContext value.");
  }

  const inconvo = providedInconvo ?? new Inconvo();
  const resolveUserContext = async () => {
    const context =
      typeof userContext === "function"
        ? await userContext()
        : await Promise.resolve(userContext);

    if (!context || typeof context !== "object") {
      throw new Error("userContext must resolve to an object.");
    }

    return context;
  };

  return tool({
    description:
      "Begin a new conversation with the data analyst. Returns a new conversation ID which can be used with the 'messageDataAgent' tool. When messaging with the same conversation ID, the data analyst will remember the context of previous messages. You can start a new conversation at any time, even if you already have an active conversation.",
    inputSchema: z.object({}),
    execute: async () => {
      const context = await resolveUserContext();
      const conversation = await inconvo.agents.conversations.create(agentId, {
        userIdentifier,
        userContext: context,
      });

      if (!conversation?.id) {
        return "Failed to start conversation with data analyst.";
      }

      return { conversationId: conversation.id };
    },
  });
};

/**
 * Send a message to the Inconvo data analyst
 */
export const messageDataAgent = (options: InconvoToolsOptions) => {
  const {
    inconvo: providedInconvo,
    agentId,
    messageDescription,
    stringifyResponse,
  } = options;

  if (!agentId) {
    throw new Error("messageDataAgent requires an agentId value.");
  }

  const inconvo = providedInconvo ?? new Inconvo();
  const serialize = ensureSerializer(stringifyResponse);
  const analystDescription =
    messageDescription ?? defaultMessageDataAgentDescription;

  return tool({
    description: analystDescription,
    inputSchema: z.object({
      conversationId: z.string().describe("The ID of the conversation."),
      message: z
        .string()
        .describe("The analysis request to send to the Data Analyst"),
    }),
    execute: async ({ conversationId, message }) => {
      const stream = inconvo.agents.conversations.response.create(
        conversationId,
        {
          agentId,
          message,
          stream: true,
        },
      );

      let finalResponse: unknown = null;

      for await (const chunk of stream) {
        if (chunk.type === "response.completed") {
          finalResponse = chunk.response;
          break;
        }
      }

      if (!finalResponse) {
        throw new Error("No response received from Inconvo");
      }

      return serialize(finalResponse);
    },
  });
};

/**
 * Convenience function to get all Inconvo Data Agent tools at once
 */
export const inconvoDataAgent = (options: InconvoToolsOptions) => {
  const { name } = options;
  const capitalizedName = name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : "";

  return {
    [`get${capitalizedName}DataAgentConnectedDataSummary`]:
      getDataAgentConnectedDataSummary(options),
    [`start${capitalizedName}DataAgentConversation`]:
      startDataAgentConversation(options),
    [`message${capitalizedName}DataAgent`]: messageDataAgent(options),
  };
};
