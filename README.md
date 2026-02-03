# @inconvoai/ai-sdk

AI SDK tools for connecting [Inconvo](https://www.npmjs.com/package/@inconvoai/node) to the [Vercel AI SDK](https://sdk.vercel.ai/docs). This package exports three tools that enable your AI applications to query and analyze data through Inconvo's data analyst.

## Installation

```bash
npm install @inconvoai/ai-sdk @inconvoai/node ai zod
```

Or with pnpm:

```bash
pnpm add @inconvoai/ai-sdk @inconvoai/node ai zod
```

> `@inconvoai/node` and `ai` are peer dependencies. Make sure your Inconvo API key is available via the `INCONVO_API_KEY` environment variable.

## Usage

```ts
import { generateText } from "ai";
import { inconvoDataAgent } from "@inconvoai/ai-sdk";

const { text } = await generateText({
  model: "openai:gpt-4",
  prompt: "What is our best performing product this week?",
  tools: inconvoDataAgent({
    agentId: "your-agent-id",
    userIdentifier: "user-123",
    userContext: { organisationId: 1 },
  }),
});

console.log(text);
```

### Combining with other tools

Use the spread operator to combine Inconvo tools with other AI SDK tools:

```ts
import { inconvoDataAgent } from "@inconvoai/ai-sdk";
import { guard, redact, verify } from "@superagent-ai/ai-sdk";

const { text } = await generateText({
  model: "openai:gpt-4",
  prompt: "What is our best performing product this week?",
  tools: {
    ...inconvoDataAgent({
      agentId: "your-agent-id",
      userIdentifier: "user-123",
      userContext: { organisationId: 1 },
    }),
    guard: guard(),
    redact: redact(),
    verify: verify(),
  },
});
```

### Using multiple data agents

Use the `name` parameter to namespace tool names when using multiple data agents:

```ts
const { text } = await generateText({
  model: "openai:gpt-4",
  prompt: "Compare HR and sales data",
  tools: {
    ...inconvoDataAgent({
      name: "hr",
      agentId: "hr-agent-id",
      userIdentifier: "user-123",
      userContext: { organisationId: 1 },
    }),
    ...inconvoDataAgent({
      name: "sales",
      agentId: "sales-agent-id",
      userIdentifier: "user-123",
      userContext: { organisationId: 1 },
    }),
  },
});
```

This creates tools like `getHrDataAgentConnectedDataSummary`, `startHrDataAgentConversation`, `getSalesDataAgentConnectedDataSummary`, etc.

### Using individual tools

If you only need specific tools, you can import them individually:

```ts
import { getDataAgentConnectedDataSummary, messageDataAgent } from "@inconvoai/ai-sdk";

const options = {
  agentId: "your-agent-id",
  userIdentifier: "user-123",
  userContext: { organisationId: 1 },
};

const { text } = await generateText({
  model: "openai:gpt-4",
  prompt: "What is our best performing product this week?",
  tools: {
    getDataAgentConnectedDataSummary: getDataAgentConnectedDataSummary(options),
    messageDataAgent: messageDataAgent(options),
  },
});
```

### With streaming

```ts
import { streamText } from "ai";
import { inconvoDataAgent } from "@inconvoai/ai-sdk";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: "openai:gpt-4",
    messages,
    tools: inconvoDataAgent({
      agentId: process.env.INCONVO_AGENT_ID!,
      userIdentifier: req.headers.get("x-user-id")!,
      userContext: async () => {
        // Fetch user context dynamically
        return { organisationId: await getOrgId() };
      },
    }),
  });

  return result.toDataStreamResponse();
}
```

## Exported Tools

### `getDataAgentConnectedDataSummary(options)`

Get a high-level summary of the connected data. The AI model should call this before asking specific questions to understand what data is available.

### `startDataAgentConversation(options)`

Start a new conversation with the Inconvo data analyst. Returns a conversation ID that can be used with `messageDataAgent`. The conversation maintains context across multiple messages.

### `messageDataAgent(options)`

Send a message to an active conversation with the data analyst. Requires a `conversationId` from `startDataAgentConversation`. The analyst can respond with charts, tables, or text depending on the query.

## Options

| Option               | Required | Description                                                                                                                                                              |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agentId`            | Yes*     | The Inconvo agent ID to query. Required for all tools.                                                                                                                  |
| `userIdentifier`     | Yes*     | A unique identifier for the user making the request. Required for `startDataAgentConversation`.                                                                          |
| `userContext`        | Yes*     | A plain object, promise, or callback (sync or async) that resolves to the user context. Required for `startDataAgentConversation`.                                      |
| `name`               | No       | Optional name to namespace tool names. Useful when using multiple data agents. Example: `name: "hr"` creates `getHrDataAgentConnectedDataSummary`.                      |
| `inconvo`            | No       | Optional custom `Inconvo` client. Defaults to `new Inconvo()` which reads configuration from environment variables.                                                     |
| `messageDescription` | No       | Optional override for the `messageDataAgent` tool description shown to the AI model.                                                                                     |
| `stringifyResponse`  | No       | Optional serializer for the analyst replies. Defaults to `JSON.stringify` (falling back to identity for strings).                                                       |

\* Different tools have different required fields. See each tool's TypeScript types for exact requirements.

## How it works

The AI model orchestrates the three tools to query your data:

1. **First**, the model calls `getDataAgentConnectedDataSummary` to understand what data is available
2. **Then**, it calls `startDataAgentConversation` to create a conversation and get a `conversationId`
3. **Finally**, it calls `messageDataAgent` with the `conversationId` and user's question to get an answer

The conversation maintains context, so follow-up questions can reference previous messages.

## Development

```bash
# Run test script
pnpm test

# Build the package
pnpm build
```

The build step emits ESM bundles (`dist/index.js`) plus TypeScript type declarations.

Releases are automated via semantic-release on pushes to `main`.
Publishing uses npm Trusted Publishing (OIDC) in CI.
