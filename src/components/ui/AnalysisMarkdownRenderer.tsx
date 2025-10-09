import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

interface AnalysisMarkdownRendererProps {
  content: string;
  className?: string;
  maxHeight?: string;
}

const AnalysisMarkdownRenderer: React.FC<AnalysisMarkdownRendererProps> = ({
  content,
  className = '',
  maxHeight = 'max-h-96'
}) => {
  return (
    <div className={cn(
      "bg-gray-50 rounded-lg p-4 overflow-y-auto prose prose-sm max-w-none",
      maxHeight,
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers with better styling for analysis
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 border-b pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 mt-3 text-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-2 mt-2 text-gray-700">
              {children}
            </h3>
          ),

          // Paragraphs and text
          p: ({ children }) => (
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              {children}
            </p>
          ),

          // Lists with better spacing
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-700 leading-relaxed">
              {children}
            </li>
          ),

          // Code blocks with syntax highlighting appearance
          code: ({ className, children, ...props }: any) => {
            // Check if this is an inline code or part of a pre block
            const isInline = !className?.startsWith('language-');

            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }

            // For code blocks inside pre, just return the code element
            // The pre component will handle the wrapper
            const language = className?.replace('language-', '') || 'text';

            return (
              <code
                className="block p-3 bg-gray-900 text-gray-100 rounded-md text-xs font-mono overflow-x-auto"
                data-language={language}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // Extract language from code child if available
            const codeElement = React.Children.toArray(children)[0] as any;
            const language = codeElement?.props?.['data-language'] || 'text';

            return (
              <div className="relative group mb-3">
                <div className="absolute top-2 right-2 text-xs text-gray-500 uppercase z-10">
                  {language}
                </div>
                <pre className="rounded-md overflow-hidden">
                  {children}
                </pre>
              </div>
            );
          },

          // Blockquotes for important notes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 pr-3 py-2 italic text-sm mb-3 text-gray-700">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              {children}
            </a>
          ),

          // Tables with better styling
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white divide-y divide-gray-200">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-4 border-gray-300" />,

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AnalysisMarkdownRenderer;