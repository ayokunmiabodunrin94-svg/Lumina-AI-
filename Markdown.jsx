import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label = 'Copy', className = '' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      className={className}
      aria-label={label}
    >
      {done ? <Check size={15} /> : <Copy size={15} />}
      <span>{done ? 'Copied' : label}</span>
    </button>
  );
}

function CodeBlock({ lang, code }) {
  return (
    <div className="my-3 rounded-2xl overflow-hidden bg-[var(--c-code)] text-[#e3e3e3] text-sm">
      <div className="flex items-center justify-between px-4 h-10 bg-[var(--c-code-head)] text-xs text-[#c4c7c5]">
        <span className="font-medium">{lang || 'code'}</span>
        <CopyButton text={code} label="Copy code" className="inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 hover:bg-white/10" />
      </div>
      <pre className="overflow-x-auto p-4 m-0">
        <code className="font-mono text-[13.5px] leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}

const components = {
  pre: ({ children }) => <>{children}</>,
  code({ node, className, children, ...props }) {
    const match = /language-([\w-]+)/.exec(className || '');
    const text = String(children).replace(/\n$/, '');
    if (match || text.includes('\n')) return <CodeBlock lang={match?.[1] || ''} code={text} />;
    return <code {...props}>{children}</code>;
  },
  a: ({ node, href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  table: ({ node, children }) => (
    <div className="table-wrap"><table>{children}</table></div>
  ),
};

function Markdown({ text }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
