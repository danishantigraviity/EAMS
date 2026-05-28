import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { aiService } from '../services/aiService';

const SUGGESTED_PROMPTS = [
  'how many assets do we have?',
  'Show unassigned laptops',
  'What assets are in maintenance?',
  'Show my assets',
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your EAMS assistant. I can help you find assets, check statuses, understand reports, and more. What can I help you with today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput('');

    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data } = await aiService.chat(newMessages.map(m => ({ role: m.role, content: m.content })));
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content, isUser) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-');
      const isNumbered = /^\d+\.\s/.test(line.trim());
      
      let cleanLine = line;
      if (isBullet) {
        cleanLine = line.replace(/^\s*[•\*\-]\s*/, '');
      }

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong 
              key={partIdx} 
              className={`font-semibold ${isUser ? 'text-white' : 'text-gray-900 dark:text-white'}`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex gap-1.5 ml-1.5 my-1 text-sm leading-relaxed">
            <span className={isUser ? 'text-white' : 'text-primary-500'}>•</span>
            <div className="flex-1">{renderedParts}</div>
          </div>
        );
      }
      
      if (isNumbered) {
        return (
          <div key={lineIdx} className="ml-1.5 my-1 text-sm leading-relaxed">
            {renderedParts}
          </div>
        );
      }

      return (
        <p key={lineIdx} className={line.trim() === '' ? 'h-2' : 'my-0.5 text-sm leading-relaxed'}>
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-5 z-50 w-80 sm:w-96 bg-white dark:bg-dark-700 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-600 flex flex-col overflow-hidden"
            style={{ height: 480 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-400">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white">EAMS Assistant</p>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full border border-white/20 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                </div>
                <p className="text-xs text-white/80">
                  {isOnline ? 'Connected' : 'Offline Mode'} • Live DB Connection
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 modal-scroll">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-500' : 'bg-gradient-to-br from-primary-400 to-accent-400'}`}>
                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-dark-600 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                    {renderMessageContent(msg.content, msg.role === 'user')}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-600 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }} transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.8 }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div className="px-3 py-2 flex gap-1.5 overflow-x-auto">
                {SUGGESTED_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="whitespace-nowrap text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-medium flex-shrink-0"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-gray-100 dark:border-dark-600 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-400 text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
