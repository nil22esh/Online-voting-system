import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage } from "../api/chat.api";
import botAvatar from "../assets/bot-avatar.png";
import "./ChatBot.css";

// ──────────────────────────────────────────────
// Icons (inline SVG to avoid extra imports)
// ──────────────────────────────────────────────
const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ──────────────────────────────────────────────
// Role-aware suggestion chips
// ──────────────────────────────────────────────
const VOTER_CHIPS = [
  "How do I vote?",
  "Is my vote counted?",
  "What is OTP?",
  "When are results out?",
  "Verify my vote",
  "Election status",
];

const ADMIN_CHIPS = [
  "Show turnout today",
  "Active elections",
  "Top candidates",
  "Recent votes",
  "Fraud alerts",
  "How do I vote?",
];

const OFFICER_CHIPS = [
  "Active elections",
  "Show turnout today",
  "Top candidates",
  "Recent votes",
  "Election status",
];

// ──────────────────────────────────────────────
// Text renderer — converts **bold** and \n to JSX
// ──────────────────────────────────────────────
const RenderMessage = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  const rendered = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i}>{part.slice(1, -1)}</code>;
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < part.split("\n").length - 1 && <br />}
      </span>
    ));
  });
  return <>{rendered}</>;
};

// ──────────────────────────────────────────────
// Typing indicator
// ──────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="chatbot-message bot chatbot-typing">
    <div className="chatbot-msg-avatar bot-avatar">
      <img src={botAvatar} alt="Bot" className="chatbot-bot-img" />
    </div>
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  </div>
);

// ──────────────────────────────────────────────
// ChatBot Component
// ──────────────────────────────────────────────
export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const chips =
    user?.role === "admin" ? ADMIN_CHIPS :
    user?.role === "officer" ? OFFICER_CHIPS :
    VOTER_CHIPS;

  // Welcome message on first open
  useEffect(() => {
    if (user && isOpen && messages.length === 0) {
      const greeting =
        user.role === "admin"
          ? `👋 Hello, **${user.name?.split(" ")[0] || "Admin"}**! I'm your election assistant. Ask me about live turnout, active elections, fraud alerts, and more.`
          : user.role === "officer"
          ? `👋 Hello, **${user.name?.split(" ")[0] || "Officer"}**! I can help you monitor elections and track participation.`
          : `👋 Hi, **${user.name?.split(" ")[0]}**! I'm here to help you navigate the voting process. What would you like to know?`;

      setMessages([{ id: Date.now(), role: "bot", text: greeting }]);
    }
  }, [isOpen, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setChipsVisible(false);

    try {
      const res = await sendChatMessage(trimmed);
      const botResponse = res.data?.data?.response || "I didn't understand that. Try rephrasing!";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: botResponse },
      ]);

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "⚠️ Sorry, I couldn't connect to the assistant. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleChipClick = (chip) => {
    sendMessage(chip);
  };

  if (!user) return null;

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        className="chatbot-fab"
        aria-label="Open chat assistant"
        onClick={isOpen ? handleClose : handleOpen}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <IconClose />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
              <img src={botAvatar} alt="Chat" className="chatbot-fab-img" />
            </motion.span>
          )}
        </AnimatePresence>
        {hasUnread && !isOpen && <span className="chatbot-badge">1</span>}
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            role="dialog"
            aria-label="Chat assistant"
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-avatar" aria-hidden="true">
                  <img src={botAvatar} alt="Bot" className="chatbot-bot-img" />
                </div>
                <div>
                  <div className="chatbot-name">VoteSecure Assistant</div>
                  <div className="chatbot-status">
                    <span className="chatbot-status-dot" />
                    Online • {user.role} mode
                  </div>
                </div>
              </div>
              <button className="chatbot-close-btn" aria-label="Close chat" onClick={handleClose}>
                <IconClose />
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages" role="log" aria-live="polite">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`chatbot-message ${msg.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`chatbot-msg-avatar ${msg.role === "bot" ? "bot-avatar" : ""}`}>
                    {msg.role === "bot"
                      ? <img src={botAvatar} alt="Bot" className="chatbot-bot-img" />
                      : user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="chatbot-bubble">
                    <RenderMessage text={msg.text} />
                  </div>
                </motion.div>
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            {chipsVisible && messages.length <= 1 && (
              <div className="chatbot-suggestions" role="group" aria-label="Suggested questions">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    className="chatbot-chip"
                    onClick={() => handleChipClick(chip)}
                    aria-label={`Ask: ${chip}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chatbot-input-area">
              <textarea
                ref={inputRef}
                className="chatbot-input"
                placeholder="Ask me anything…"
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Chat input"
                disabled={isTyping}
              />
              <button
                className="chatbot-send-btn"
                onClick={() => sendMessage(input)}
                disabled={isTyping || !input.trim()}
                aria-label="Send message"
              >
                <IconSend />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
