import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm max-w-none break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize rendering components
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 break-words">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 break-words">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-1 break-words">{children}</h3>,
          p: ({ children }) => <p className="mb-2 text-sm break-words">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1 text-sm break-words">{children}</li>,
          code: ({ inline, children }) => {
            if (inline) {
              return <code className="px-1 py-0.5 bg-gray-100 rounded text-sm break-all">{children}</code>;
            }
            return (
              <code className="block p-2 bg-gray-100 rounded text-sm overflow-x-auto whitespace-pre-wrap break-all">{children}</code>
            );
          },
          pre: ({ children }) => <pre className="mb-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 italic text-sm mb-2">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full divide-y divide-gray-200">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="px-2 py-1 text-sm text-gray-900">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;