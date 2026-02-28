import { memo } from "react";
import Markdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css"; // Start with a default dark theme

interface MarkdownRendererProps {
  content: string;
}

// ⚡ Bolt Optimization: Define plugins and components statically outside the component body
// This prevents react-markdown from re-parsing the entire AST on every render during message streaming
const staticRemarkPlugins = [remarkGfm];
const staticRehypePlugins = [rehypeHighlight];

const markdownComponents: Components = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:underline"
    />
  ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="bg-gray-900/50 rounded-lg p-0 overflow-x-auto border border-white/10"
    />
  ),
  code: ({ node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !String(children).includes("\n");

    return isInline ? (
      <code
        {...props}
        className={`${className} bg-white/10 rounded px-1 py-0.5 text-[0.9em]`}
      >
        {children}
      </code>
    ) : (
      <code
        {...props}
        className={`${className} block p-4 text-sm font-mono`}
      >
        {children}
      </code>
    );
  },
  ul: ({ node, ...props }) => (
    <ul {...props} className="list-disc pl-4 space-y-1" />
  ),
  ol: ({ node, ...props }) => (
    <ol {...props} className="list-decimal pl-4 space-y-1" />
  ),
  li: ({ node, ...props }) => (
    <li {...props} className="marker:text-gray-400" />
  ),
};

// ⚡ Bolt Optimization: Wrap component in React.memo to prevent unnecessary re-renders when parent streams new messages
export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <Markdown
        remarkPlugins={staticRemarkPlugins as any}
        rehypePlugins={staticRehypePlugins as any}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  );
});
