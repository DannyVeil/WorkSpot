import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_CHAT_MESSAGES, buildSupportReply, createChatMessage } from '../data/chat.js';

/** Демо-чат техподдержки с автоответом (backend-чата в текущей версии нет). */
export function useSupportChat(user) {
  const [messages, setMessages] = useState(INITIAL_CHAT_MESSAGES);
  const [typing, setTyping] = useState(false);
  const timers = useRef(new Set());

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const sendMessage = useCallback(
    (text) => {
      const value = String(text || '').trim();
      if (!value) return;

      setMessages((prev) => [
        ...prev,
        createChatMessage({
          sender: 'user',
          author: user?.name || 'Гость',
          text: value,
        }),
      ]);
      setTyping(true);

      const timer = setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          createChatMessage({
            sender: 'support',
            author: 'Елена • Поддержка WorkSpot',
            text: buildSupportReply(value),
            delay: 1,
          }),
        ]);
        timers.current.delete(timer);
      }, 900);

      timers.current.add(timer);
    },
    [user],
  );

  return { messages, typing, sendMessage };
}
