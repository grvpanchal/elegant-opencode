// Elegant plugin for opencode.
// Registers an `elegant_build` tool. When invoked, it runs the
// universal-architecture pipeline, dispatching variable microtasks to opencode
// subagents via ctx.client (creating a child session per call and dispatching
// the subagent through session.prompt) and emitting fixed microtasks
// deterministically.

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

          // LLM bridge: dispatch each variable microtask to its bound subagent.
          // opencode 1.14 SDK shape:
          //   1. session.create({ parentID, title }) → child Session
          //   2. session.prompt({ path:{id}, body:{ agent, system, parts } })
          //      runs the named subagent inside that child session and returns
          //      { info: AssistantMessage, parts: Part[] }.
          // We extract concatenated TextPart.text as the model output.
          const llm = async ({ agent, system, user, task }) => {
            const child = await client.session.create({
              body: {
                parentID: agentCtx.sessionID,
                title: `elegant:${task}`
              }
            });
            if (child.error || !child.data?.id) {
              throw new Error(
                `session.create failed for "${task}": ${stringifyErr(child.error) || "no session id returned"}`
              );
            }
            const childId = child.data.id;

            const res = await client.session.prompt({
              path: { id: childId },
              body: {
                agent,
                system,
                parts: [{ type: "text", text: user }]
              }
            });
            if (res.error || !res.data) {
              throw new Error(
                `session.prompt failed for "${task}" (agent="${agent}"): ${stringifyErr(res.error) || "no data returned"}`
              );
            }

            const text = (res.data.parts || [])
              .filter((p) => p && p.type === "text" && typeof p.text === "string")
              .map((p) => p.text)
              .join("");
            if (!text) {
              const seenTypes = (res.data.parts || []).map((p) => p?.type).join(",");
              throw new Error(
                `subagent "${agent}" for "${task}" returned no text parts (saw: ${seenTypes || "none"})`
              );
            }
            return text;
          };

          const trace = [];
          const result = await runPipeline({
            entitySpec,
            llm,
            onTrace: (t) => trace.push(t)
          });

          await emitProject({ result, $, directory });

          const okCount = trace.filter((t) => t.ok).length;
          return {
            output: `Elegant pipeline complete. ${okCount}/${trace.length} microtask events succeeded; ${Object.keys(result).length} microtasks ran across ${TERMINOLOGY ? Object.keys(TERMINOLOGY).length : "?"} skill bindings. Files written under ${process.env.ELEGANT_OUTPUT_DIR || directory}.`,
            metadata: {
              trace,
              terminology: Object.keys(TERMINOLOGY),
              outputs: Object.keys(result)
            }
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

function stringifyErr(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

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
