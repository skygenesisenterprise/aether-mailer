"use client";

import { useState, useEffect } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CodeSample {
  language: string;
  code: string;
  filename: string;
}

interface CodeBlockProps {
  samples: CodeSample[];
  defaultLanguage?: string;
  showLineNumbers?: boolean;
}

function highlightSyntax(code: string, language: string): string {
  let escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const keywordPattern =
    language === "python"
      ? /\b(def|return|if|import|from|class|self|await|async|lambda|try|except)\b/g
      : /\b(const|let|var|function|return|if|import|from|class|new|await|async)\b/g;

  const stringPattern = /(['"`])([^'"]*?)\1/g;
  const commentPattern = /#.*$/gm;
  const functionPattern = /\b\w+(?=\()/g;
  const propertyPattern = /\.\w+(?=\s*[,);]|$)/g;

  escaped = escaped.replace(keywordPattern, '<span class="text-blue-400">$&</span>');
  escaped = escaped.replace(stringPattern, '<span class="text-amber-400">$1$2$1</span>');
  escaped = escaped.replace(commentPattern, '<span class="text-zinc-500">$&</span>');
  escaped = escaped.replace(functionPattern, '<span class="text-violet-400">$&</span>');
  escaped = escaped.replace(propertyPattern, '<span class="text-teal-400">$&</span>');

  return escaped;
}

export function CodeBlock({
  samples,
  defaultLanguage = "typescript",
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSelectedLang(defaultLanguage);
    setMounted(true);
  }, [defaultLanguage]);

  const currentSample = samples.find((s) => s.language === selectedLang) || samples[0];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentSample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = currentSample.code.split("\n");

  if (!mounted || !selectedLang) {
    return (
      <div className="relative rounded-lg border border-background/20 bg-background/5 overflow-hidden h-[200px]" />
    );
  }

  return (
    <div className="relative rounded-lg border border-background/20 bg-background/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-background/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-background/20" />
            <div className="w-3 h-3 rounded-full bg-background/20" />
            <div className="w-3 h-3 rounded-full bg-background/20" />
          </div>
          <span className="text-sm text-background/50 font-mono">{currentSample.filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs uppercase tracking-wider hover:bg-background/10 transition-colors rounded text-background"
            >
              {selectedLang}
              <ChevronDown className="h-3 w-3 text-background" />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 py-1 w-32 rounded-md border border-border bg-card shadow-lg z-50"
                >
                  {samples.map((sample, index) => (
                    <button
                      type="button"
                      key={`${sample.language}-${index}`}
                      onClick={() => {
                        setSelectedLang(sample.language);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs uppercase tracking-wider hover:bg-accent transition-colors ${
                        selectedLang === sample.language
                          ? "text-accent-foreground font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      {sample.language}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-background/10 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 text-background/50" />
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm font-mono overflow-x-auto">
        <code>
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && (
                <span className="select-none w-8 text-right pr-4 text-background/30">
                  {index + 1}
                </span>
              )}
              <span
                className="flex-1"
                dangerouslySetInnerHTML={{
                  __html: highlightSyntax(line, currentSample.language),
                }}
              />
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
