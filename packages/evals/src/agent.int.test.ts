import { describe, test, expect } from "vitest";  // Fixed: Added explicit imports
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

import { graph } from "@opencanvas/agents/dist/open-canvas/index";
import { QUERY_ROUTING_DATA } from "./data/query_routing.js";
import { CODEGEN_DATA } from "./data/codegen.js";

describe("query routing", () => {
  test("routes followups with questions to update artifact", async () => {
    const { inputs, referenceOutputs } = QUERY_ROUTING_DATA;
    const generatePathNode = graph.nodes.generatePath;
    const res = await generatePathNode.invoke(inputs, {
      configurable: {
        customModelName: "gpt-4o-mini",
      },
    });
    console.log("Outputs:", res);
    expect(res).toEqual(referenceOutputs);
  });
});

const qualityEvaluator = async (params: {
  inputs: string;
  outputs: string;
}) => {
  const judge = new ChatOpenAI({ model: "gpt-4o" }).withStructuredOutput(
    z.object({
      justification: z
        .string()
        .describe("reasoning for why you are assigning a given quality score"),
      quality_score: z
        .number()
        .describe(
          "quality score for how well the generated code answers the query."
        ),
    }),
    {
      name: "judge",
    }
  );
  const EVAL_PROMPT = [
    `Given the following user query and generated code, judge whether the`,
    `code satisfies the user's query. Return a quality score between 1 and 10,`,
    `where a 1 would be completely irrelevant to the user's input, and 10 would be a perfectly accurate code sample.`,
    `A 5 would be a code sample that is partially on target, but is missing some aspect of a user's request.`,
    `Justify your answer.\n`,
    `<query>\n${params.inputs}\n</query>\n`,
    `<generated_code>\n${params.outputs}\n</generated_code>`,
  ].join(" ");
  const res = await judge.invoke(EVAL_PROMPT);
  return {
    key: "quality",
    score: res.quality_score,
    comment: res.justification,
  };
};

describe("codegen", () => {
  test("generate code with an LLM agent when asked", async () => {
    const { inputs } = CODEGEN_DATA;
    const generateArtifactNode = graph.nodes.generateArtifact;
    const res = await generateArtifactNode.invoke(inputs, {
      configurable: {
        customModelName: "gpt-4o-mini",
      },
    });
    console.log("Outputs:", res);
    const generatedCode = (res.artifact?.contents[0] as any).code;
    expect(generatedCode).toBeDefined();

    const evaluation = await qualityEvaluator({
      inputs: inputs.messages[0].content,
      outputs: generatedCode,
    });
    console.log("Evaluation:", evaluation);
  });
});