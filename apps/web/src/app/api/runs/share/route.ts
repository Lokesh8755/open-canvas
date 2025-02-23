import { NextRequest, NextResponse } from "next/server";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function shareRunWithRetry(runId: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return `https://example.com/shared-run/${runId}`;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      console.warn(
        `Attempt ${attempt} failed. Retrying in ${RETRY_DELAY / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Max retries reached"); // This line should never be reached due to the throw in the loop
}

export async function POST(req: NextRequest) {
  const { runId } = await req.json();

  if (!runId) {
    return new NextResponse(
      JSON.stringify({
        error: "`runId` is required to share run.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const sharedRunURL = await shareRunWithRetry(runId);

    return new NextResponse(JSON.stringify({ sharedRunURL }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      `Failed to share run with id ${runId} after ${MAX_RETRIES} attempts:\n`,
      error
    );
    return new NextResponse(
      JSON.stringify({ error: "Failed to share run after multiple attempts." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
