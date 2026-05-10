import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, Play, Copy, Check, RotateCcw } from 'lucide-react';

const languageConfig = {
  python: {
    label: 'Python',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    keywords: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'pass', 'break', 'continue', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self']
  },
  javascript: {
    label: 'JavaScript',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'from', 'class', 'extends', 'try', 'catch', 'finally', 'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined']
  },
  java: {
    label: 'Java',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'void', 'int', 'String', 'boolean', 'if', 'else', 'for', 'while', 'return', 'new', 'try', 'catch', 'finally', 'throw', 'throws', 'this', 'super', 'null', 'true', 'false']
  }
};

export const CodeEditor = ({
  language = 'python',
  initialCode = '',
  onCodeChange,
  onSubmit,
  disabled = false,
  questionText = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const config = languageConfig[language] || languageConfig.python;

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      updateLineCount(initialCode);
    }
  }, [initialCode]);

  const updateLineCount = (text) => {
    const lines = text.split('\n').length;
    setLineCount(Math.max(lines, 10));
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateLineCount(newCode);
    onCodeChange?.(newCode);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      onCodeChange?.(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    updateLineCount(initialCode);
    onCodeChange?.(initialCode);
  };

  const handleSubmit = () => {
    onSubmit?.(code);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${config.bg}`}>
            <Code2 className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Reset code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex relative">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 bg-slate-800/50 text-right pr-3 py-4 text-slate-500 text-sm font-mono select-none overflow-hidden"
          style={{ lineHeight: '1.5rem' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          disabled={disabled}
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-100 font-mono text-sm p-4 resize-none outline-none min-h-[300px] placeholder-slate-600"
          style={{ lineHeight: '1.5rem', tabSize: 4 }}
          placeholder={`// Write your ${config.label} solution here...\n\n`}
        />
      </div>

      {/* Footer with Submit */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          {code.split('\n').length} lines | {code.length} characters
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !code.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
        >
          <Play className="w-4 h-4" />
          Submit Code
        </button>
      </div>
    </motion.div>
  );
};

export default CodeEditor;
