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
  const [localPlaceholder, setLocalPlaceholder] = useState<string>(
    'Type your question...'
  );

  const exampleQuestions = [
    { emoji: '✨', question: 'Why is Face Institute unique?' },
    { emoji: '👨‍⚕️', question: 'Who are the doctors?' },
    { emoji: '❓', question: 'What is a deep plane facelift?' },
  ];

  const handleExampleQuestionClick = (question: string) => {
    setInput(question);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    // Add the assistant's message placeholder immediately
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input, threadId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantReply += chunk;

          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: assistantReply,
              };
            }
            return updated;
          });
        }

        // Update thread ID if received in header
        const newThreadId = res.headers.get('x-thread-id');
        if (newThreadId) setThreadId(newThreadId);

        setHasSentMessage(true);
      } else {
        throw new Error('Streaming failed: No readable stream.');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ An error occurred. Please try again later.',
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

  useEffect(() => {
    if (messages.length > 1) {
      setLocalPlaceholder('Ask more...');
    } else {
      setLocalPlaceholder('Type your question...');
    }
  }, [messages.length]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((msg, index) => {
          const cleanedContent = msg.content
            .replace(/【[^】]+】/g, '')
            .replace(/(https?:\/\/[^\s]+)/g, url => `[${url}](${url})`);

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
                {loading &&
                  index === messages.length - 1 &&
                  msg.role === 'assistant' &&
                  msg.content === '' && (
                    <div className={styles.typing}>
                      <span className={styles.dot}>.</span>
                      <span className={styles.dot}>.</span>
                      <span className={styles.dot}>.</span>
                    </div>
                  )}
                {loading &&
                  index === messages.length - 1 &&
                  msg.role === 'assistant' &&
                  msg.content !== '' && (
                    <div className={styles.typing}>
                      <span className={styles.dot}>.</span>
                      <span className={styles.dot}>.</span>
                      <span className={styles.dot}>.</span>
                    </div>
                  )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.exampleQuestions}>
        {exampleQuestions.map((item, index) => (
          <button
            key={index}
            className={styles.exampleQuestionButton}
            onClick={() => handleExampleQuestionClick(item.question)}
          >
            {item.emoji} {item.question}
          </button>
        ))}
      </div>

      {!loading && (
        <>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setLocalPlaceholder('');
            }}
            onBlur={() => {
              if (hasSentMessage) {
                setLocalPlaceholder(input.trim() ? '' : 'Ask more...');
              } else {
                setLocalPlaceholder(
                  input.trim() ? '' : 'Type your question...'
                );
              }
            }}
            placeholder={localPlaceholder}
            rows={2}
          />
        </>
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
