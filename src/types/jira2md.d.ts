declare module 'jira2md' {
  export function toM(jiraString: string): string;
  export function toJ(markdownString: string): string;

  const J2M: {
    toM: (jiraString: string) => string;
    toJ: (markdownString: string) => string;
  };

  export default J2M;
}