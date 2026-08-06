import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import api from '../api/client';

const SUGGESTIONS = [
  'Give me an overview of my portfolio',
  'Should I buy, hold, or sell anything?',
  'How is my portfolio diversified?',
  'What is my risk profile and how can I improve it?',
];

const WELCOME_MESSAGE =
  "Hi! I'm your AI portfolio advisor. I can analyze your current holdings and give suggestions on potential buying and selling options. How can I help?";

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const startChat = (msg) => {
    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    const history = [...messages, { role: 'user', content: msg }]
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    api
      .sendChatMessage(history)
      .then((res) => {
        setLoading(false);
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      })
      .catch((err) => {
        setLoading(false);
        setError(
          err?.response?.data?.message || err?.message || 'Failed to get a response. Please try again.',
        );
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    startChat(msg);
  };

  const handleReset = () => {
    setError(null);
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-[92vw] max-w-md h-[min(70vh,560px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-600 dark:bg-brand-700 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <div className="text-sm font-semibold leading-tight">AI Portfolio Advisor</div>
                <div className="text-[11px] text-white/75 leading-tight">
                  Suggestions based on your current portfolio
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/40"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your portfolio…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          <div className="px-3 pt-2 flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => startChat(s)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-600/15 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your holdings, buying or selling…"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white px-3.5 flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-brand-600/30 text-white transition-all ${
          isOpen ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-600 hover:bg-brand-700'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default ChatWidget;
