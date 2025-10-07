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

  // Check if there are any user comments after the latest AI comment
  const latestAITime = new Date(latestAIComment.createdAt).getTime();

  // Check hidden comments for user comments after AI
  const hasUserCommentAfterAI = sortedHidden.some(comment =>
    comment.authorType === 'user' &&
    new Date(comment.createdAt).getTime() > latestAITime
  );

  // Also check regular Jira comments if provided
  if (regularComments && regularComments.length > 0) {
    const hasRegularCommentAfterAI = regularComments.some(comment =>
      new Date(comment.created || comment.createdAt).getTime() > latestAITime
    );

    if (hasRegularCommentAfterAI || hasUserCommentAfterAI) {
      return { status: 'pending', latestAnalysis: latestAIComment };
    }
  } else if (hasUserCommentAfterAI) {
    return { status: 'pending', latestAnalysis: latestAIComment };
  }

  return { status: 'complete', latestAnalysis: latestAIComment };
}
