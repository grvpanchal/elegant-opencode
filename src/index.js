// Elegant plugin for opencode.
// Registers the /elegant command + an `elegant_build` tool. When invoked, it
// runs the universal-architecture pipeline, dispatching variable microtasks
// to opencode subagents via ctx.client (Task tool) and emitting fixed
// microtasks deterministically.

import { runPipeline } from "./orchestrator.js";
import { TERMINOLOGY } from "./terminology.js";

/** @type {import('@opencode-ai/plugin').Plugin} */
export const ElegantPlugin = async (ctx) => {
  const { client, $, directory } = ctx;

  return {
    tool: {
      elegant_build: tool({
        description:
          "Build a feature using the Elegant universal-frontend architecture. Decomposes into terminology microtasks, runs fixed parts deterministically, and dispatches variable parts to subagents.",
        args: {
          spec: tool.schema
            .string()
            .describe('Plain-English feature spec, e.g. "build a todo app"'),
          entity: tool.schema
            .string()
            .optional()
            .describe('Optional pre-extracted entity name, e.g. "Todo"')
        },
        async execute({ spec, entity }, agentCtx) {
          const entitySpec = { spec, hint: entity };

          // The LLM bridge: call opencode subagents via the Task tool.
          const llm = async ({ agent, system, user, task }) => {
            const out = await client.task.invoke({
              agent,
              prompt: `${system}\n\n---\n\n${user}`,
              sessionID: agentCtx.sessionID,
              metadata: { microtask: task }
            });
            return out.text || out.output || JSON.stringify(out);
          };

          const trace = [];
          const result = await runPipeline({
            entitySpec,
            llm,
            onTrace: (t) => trace.push(t)
          });

          // Materialise to disk through opencode's existing write tool so the
          // user gets a real project, not just JSON.
          await emitProject({ result, $, directory });

          return {
            summary: `Elegant pipeline complete. ${trace.filter((t) => t.ok).length}/${trace.length} microtasks succeeded.`,
            trace,
            terminology: Object.keys(TERMINOLOGY),
            outputs: Object.keys(result)
          };
        }
      })
    },

    "chat.params": async ({ agent }, params) => {
      // Pin temperature low for ALL Elegant subagents — small models drift.
      if (agent && agent.endsWith("-agent")) {
        params.temperature = 0.05;
        params.options = params.options || {};
        params.options.top_p = 0.9;
      }
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // no-op; reserved for telemetry hooks
      }
    }
  };
};

// Expose `tool` from the opencode plugin SDK.
import { tool } from "@opencode-ai/plugin";

async function emitProject({ result, $, directory }) {
  // Render real files from the structured outputs. Implementation lives in
  // src/code-emitter.js so it is easy to swap per-framework.
  const target = process.env.ELEGANT_OUTPUT_DIR
    ? (await import("node:path")).resolve(directory, process.env.ELEGANT_OUTPUT_DIR)
    : directory;
  const { emit } = await import("./code-emitter.js");
  await emit({ result, $, directory: target });
}

export default ElegantPlugin;
