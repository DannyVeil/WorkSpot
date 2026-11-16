import { useEffect, useRef, useState } from 'react';
import { Clock, MessageSquare, Send } from 'lucide-react';
import { QUICK_QUESTIONS, SUPPORT_WELCOME } from '../../data/chat.js';

/** mm:ss для таймера ожидания ответа. */
function formatRetry(seconds) {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Чат техподдержки: сообщения уходят оператору в Telegram, ответы приходят сюда. */
export default function SupportChat({
  messages,
  typing,
  error,
  canSend = true,
  retryInSeconds = 0,
  onSendMessage,
  focusSignal = 0,
}) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const visibleMessages = messages.length ? messages : [SUPPORT_WELCOME];

  useEffect(() => {
    if (focusSignal > 0) {
      setTimeout(() => chatInputRef.current?.focus(), 150);
    }
  }, [focusSignal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, typing]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;
    const value = chatInput.trim();
    if (!value) return;
    onSendMessage(value);
    setChatInput('');
  };

  return (
    <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden flex flex-col h-[580px] lg:sticky lg:top-24">
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#19B5FE] to-[#0099E5] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white border border-white/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#19B5FE]" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base leading-tight">Поддержка WorkSpot</h2>
            <p className="text-xs text-sky-100 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Онлайн 24/7 • Отвечаем за 1 минуту
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F2F7FC] custom-scrollbar">
        {visibleMessages.map((message) => {
          const isUser = message.sender === 'user';

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {!isUser && (
                <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
                  {message.author || 'Поддержка WorkSpot'}
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-[#19B5FE] text-white rounded-br-xs'
                    : 'bg-white text-[#0F2942] border border-sky-100 rounded-bl-xs'
                } ${message.failed ? 'opacity-60' : ''}`}
              >
                {message.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {message.failed ? 'Не отправлено' : message.pending ? 'Отправляется…' : message.time}
              </span>
            </div>
          );
        })}

        {typing && (
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
              Поддержка WorkSpot
            </span>
            <div className="bg-white border border-sky-100 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {QUICK_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={!canSend}
            onClick={() => onSendMessage(question)}
            className="shrink-0 text-xs font-semibold text-[#19B5FE] bg-[#F2F7FC] hover:bg-[#E8F3FF] border border-sky-200/70 px-3 py-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {question}
          </button>
        ))}
      </div>

      {!canSend && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Ответ оператора уже в пути. Написать ещё раз можно через {formatRetry(retryInSeconds)}
          </span>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-[11px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          ref={chatInputRef}
          type="text"
          value={chatInput}
          disabled={!canSend}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={canSend ? 'Напишите ваш вопрос...' : 'Дождитесь ответа поддержки'}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#F2F7FC] border border-sky-100 text-sm text-[#0F2942] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Отправить сообщение"
          className="p-2.5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
