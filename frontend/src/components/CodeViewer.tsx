import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

interface CodeViewerProps {
  title?: string;
  code: string;
  language: string;
  maxHeight?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  title,
  code,
  language,
  maxHeight = 'max-h-72',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.trim().split('\n').length;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090D16] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Code className="w-3.5 h-3.5 text-blue-400" />
          {title && <span className="font-semibold text-slate-200">{title}</span>}
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono text-slate-400 border border-slate-700">
            {language}
          </span>
          <span className="text-[10px] text-slate-500">{lineCount} lines</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre className={`p-3 overflow-x-auto overflow-y-auto font-mono text-slate-300 ${maxHeight} leading-relaxed select-text`}>
        <code>{code}</code>
      </pre>
    </div>
  );
};
