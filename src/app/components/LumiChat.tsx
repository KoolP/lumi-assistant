'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LumiChat.module.css';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function LumiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input, threadId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if ('reply' in data) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);
        setThreadId(data.threadId);
        setHasSentMessage(true);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred. Please try again later.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((msg, index) => {
          const cleanedContent = msg.content
            .replace(/【[^】]+】/g, '')
            .replace(/(https?:\/\/[^\s]+)/g, url => `[${url}](${url})`); // ✅ removes

          return (
            <div
              key={index}
              className={`${styles.message} ${
                msg.role === 'user'
                  ? styles.messageUser
                  : styles.messageAssistant
              }`}
            >
              <div
                className={`${styles.bubble} ${
                  msg.role === 'user' ? styles.userBubble : ''
                }`}
              >
                <ReactMarkdown
                  components={{
                    a: ({ ...props }) => (
                      <a
                        {...props}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={styles.link}
                      />
                    ),
                    p: ({ ...props }) => (
                      <p {...props} style={{ marginBottom: '1rem' }} />
                    ),
                  }}
                >
                  {cleanedContent}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {!loading && (
        <textarea
          className={styles.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasSentMessage
              ? 'Ask more...'
              : 'Type your question about treatments, pricing, or anything else...'
          }
          rows={3}
        />
      )}

      <button
        onClick={sendMessage}
        disabled={loading || !input.trim()}
        className={`${styles.button} ${loading ? styles.loading : ''}`}
      >
        {loading ? 'generating...' : 'Send'}
      </button>
    </div>
  );
}
