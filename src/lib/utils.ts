import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { HiddenComment } from "../types/jira.types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract the analysis content from a hidden comment
 * Removes everything before "1. UNDERSTANDING CONFIRMATION" if it exists
 */
export function extractAnalysisContent(content: string): string {
  if (!content) return '';

  // Find the position of "1. UNDERSTANDING CONFIRMATION"
  const marker = "1. UNDERSTANDING CONFIRMATION";
  const markerIndex = content.indexOf(marker);

  if (markerIndex !== -1) {
    // Return everything from the marker onwards
    return content.substring(markerIndex).trim();
  }

  // If marker not found, return the original content
  return content.trim();
}

/**
 * Format analysis content for display
 * Cleans up formatting and prepares for markdown rendering
 */
export function formatAnalysisForDisplay(content: string): string {
  if (!content) return '';

  // Extract the actual analysis content
  let formatted = extractAnalysisContent(content);

  // Remove excessive blank lines (more than 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Ensure headers have proper spacing
  formatted = formatted.replace(/^(#{1,6})\s*/gm, '$1 ');

  return formatted;
}

/**
 * Check if analysis is complete based on comments
 * Returns 'complete' if last relevant comment is from AI, 'pending' otherwise
 */
export function checkAnalysisStatus(
  hiddenComments: HiddenComment[],
  regularComments?: any[]
): { status: 'complete' | 'pending' | 'none'; latestAnalysis?: HiddenComment } {
  if (!hiddenComments || hiddenComments.length === 0) {
    return { status: 'none' };
  }

  // Sort hidden comments by creation date (newest first)
  const sortedHidden = [...hiddenComments].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Find the latest AI comment
  const latestAIComment = sortedHidden.find(comment => comment.authorType === 'ai');

  if (!latestAIComment) {
    return { status: 'none' };
  }

  // Get the timestamp of the latest AI comment
  const latestAITime = new Date(latestAIComment.createdAt).getTime();

  // Check if the most recent comment overall is from AI
  const mostRecentComment = sortedHidden[0];
  const isMostRecentFromAI = mostRecentComment.authorType === 'ai' &&
    mostRecentComment.id === latestAIComment.id;

  // If the latest AI comment is the most recent overall, check regular comments too
  if (isMostRecentFromAI) {
    // Check if there are any regular Jira comments after the AI analysis
    if (regularComments && regularComments.length > 0) {
      const hasRegularCommentAfterAI = regularComments.some(comment => {
        const commentTime = new Date(comment.created || comment.createdAt).getTime();
        // Add small tolerance (1 second) to handle timestamp precision issues
        return commentTime > (latestAITime + 1000);
      });

      if (hasRegularCommentAfterAI) {
        return { status: 'pending', latestAnalysis: latestAIComment };
      }
    }

    // AI is most recent and no newer regular comments
    return { status: 'complete', latestAnalysis: latestAIComment };
  }

  // If the most recent comment is not from AI, then there are comments after the AI analysis
  return { status: 'pending', latestAnalysis: latestAIComment };
}
