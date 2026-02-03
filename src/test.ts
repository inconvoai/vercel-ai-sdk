import { generateText, stepCountIs } from "ai";
import { inconvoDataAgent } from "./index";

async function main() {
  const result = await generateText({
    model: "openai/gpt-5-mini",
    prompt:
      "From the connected data generate and answer one data-backed question.",
    tools: {
      ...inconvoDataAgent({
        agentId: process.env.INCONVO_AGENT_ID || "test-agent-id",
        userIdentifier: "test-user-123",
        userContext: {
          organisationId: 1,
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  console.dir(result.steps, { depth: null });
  console.log("Result:", result.text);
}

main().catch(console.error);
