import { useCallback, useState } from "react";

export interface FeedbackResponse {
  success: boolean;
  feedback: {
    key: string;
    score: number;
    comment?: string;
  };
}

interface UseFeedbackResult {
  isLoading: boolean;
  error: string | null;
  sendFeedback: (
    feedbackKey: string,
    score: number,
    comment?: string
  ) => Promise<FeedbackResponse | undefined>;
  getFeedback: (
    feedbackKey: string
  ) => Promise<{ key: string; score: number; comment?: string }[] | undefined>;
}

export function useFeedback(): UseFeedbackResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendFeedback = useCallback(
    async (
      feedbackKey: string,
      score: number,
      comment?: string
    ): Promise<FeedbackResponse | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          body: JSON.stringify({ feedbackKey, score, comment }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          return;
        }

        return (await res.json()) as FeedbackResponse;
      } catch (error) {
        console.error("Error sending feedback:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        return;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getFeedback = useCallback(
    async (
      feedbackKey: string
    ): Promise<{ key: string; score: number; comment?: string }[] | undefined> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/feedback?feedbackKey=${encodeURIComponent(feedbackKey)}`
        );

        if (!res.ok) {
          return;
        }

        return await res.json();
      } catch (error) {
        console.error("Error getting feedback:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        return;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    sendFeedback,
    getFeedback,
    error,
  };
}