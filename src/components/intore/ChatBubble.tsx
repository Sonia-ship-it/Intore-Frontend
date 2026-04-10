import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface ChatBubbleProps {
  role: 'ai' | 'user';
  content: string;
  isStreaming?: boolean;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  const renderInline = (line: string): React.ReactNode => {
    // bold **text**, inline code `code`
    const parts = line.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={j} className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[12px] font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Heading ### or ##
    if (line.startsWith('### ')) {
      nodes.push(<p key={i} className="font-bold text-sm mt-2 mb-0.5">{renderInline(line.slice(4))}</p>);
    } else if (line.startsWith('## ')) {
      nodes.push(<p key={i} className="font-bold text-base mt-3 mb-1">{renderInline(line.slice(3))}</p>);
    }
    // Bullet list
    else if (line.match(/^[-*•]\s/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*•]\s/)) {
        items.push(<li key={i} className="ml-3">{renderInline(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1">{items}</ul>);
      continue;
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(<li key={i} className="ml-3">{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 my-1">{items}</ol>);
      continue;
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      nodes.push(<hr key={i} className="border-current opacity-20 my-2" />);
    }
    // Empty line → spacing
    else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-1.5" />);
    }
    // Normal paragraph
    else {
      nodes.push(<p key={i} className="leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }
  return nodes;
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  const isAi = role === 'ai';
  return (
    <div className={cn('flex gap-2 animate-slide-up-chat', isAi ? 'justify-start' : 'justify-end')}>
      {isAi && (
        <div className="w-6 h-6 rounded-md bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-3.5 h-3.5 text-[#4B7BFF]" />
        </div>
      )}
      <div className={cn(
        'max-w-[82%] rounded-2xl px-4 py-3 text-sm',
        isAi
          ? 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/90 rounded-tl-sm shadow-sm'
          : 'bg-[#0F1547] text-white rounded-tr-sm shadow-sm'
      )}>
        <div className="space-y-0.5">
          {renderMarkdown(content)}
        </div>
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse opacity-70" />}
      </div>
    </div>
  );
}
