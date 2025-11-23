
import React, { useState, useRef, useEffect } from 'react';
import { getCoachResponse } from '../services/geminiService';
import { ChatMessage, Persona } from '../types';
import { Send, Sparkles, Loader2, Minimize2 } from 'lucide-react';

interface CoachWidgetProps {
  persona?: Persona;
}

export const CoachWidget: React.FC<CoachWidgetProps> = ({ persona = 'Neutral / Stoic' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hey! 👋 I'm Aion. I'm currently in ${persona.split('/')[0]} mode. What's up?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset welcome message if persona changes
  useEffect(() => {
     setMessages(prev => [
         ...prev, 
         {
             id: Date.now().toString(),
             role: 'model',
             text: `(System: Switching personality to ${persona}...)`,
             timestamp: new Date()
         }
     ]);
  }, [persona]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Inject Persona instruction into the history context or append to prompt
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      // Slight hack: Append persona instruction to user message for context if service doesn't support separate config update easily per request
      const contextMessage = `[System Instruction: Respond with this persona: ${persona}]. User says: ${userMsg.text}`;
      
      const responseText = await getCoachResponse(history, contextMessage);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Just thinking...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Glitch in the matrix. Try again in a sec.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-aion-primary hover:bg-emerald-700 text-white p-4 rounded-full shadow-xl shadow-emerald-200/50 transition-all hover:scale-110 flex items-center gap-2 ring-4 ring-white"
          >
              <Sparkles className="w-6 h-6" />
              <span className="font-bold text-sm pr-1">Ask Aion</span>
          </button>
      )
  }

  return (
    <div className="flex flex-col h-[500px] w-full max-w-[350px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-aion-primary to-teal-400 flex items-center justify-center shadow-md shadow-emerald-100">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Aion Coach</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {persona.split('/')[0]}
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
            <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-aion-primary text-white rounded-br-none shadow-emerald-100'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-none flex items-center space-x-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-aion-primary" />
              <span className="text-xs text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex items-center space-x-2 bg-slate-50 rounded-2xl p-1 pr-2 border border-slate-200 focus-within:border-aion-primary focus-within:ring-1 focus-within:ring-aion-primary/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none text-slate-800 text-sm placeholder-slate-400 px-4 py-2 focus:ring-0"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-aion-primary hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
    