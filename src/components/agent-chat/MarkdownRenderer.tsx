import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css"; // Start with a default dark theme

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words text-foreground">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 hover:underline transition-colors"
            />
          ),
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className="bg-muted border border-border/50 rounded-lg p-0 overflow-x-auto text-[13px]"
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            return isInline ? (
              <code
                {...props}
                className={`${className} bg-primary/10 text-primary font-semibold rounded px-1.5 py-0.5 text-[0.9em]`}
              >
                {children}
              </code>
            ) : (
              <code
                {...props}
                className={`${className} block p-4 text-sm font-mono text-foreground/90`}
              >
                {children}
              </code>
            );
          },
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-5 space-y-1 mb-4" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-5 space-y-1 mb-4" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="marker:text-muted-foreground/50 text-foreground/90 leading-relaxed" />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
