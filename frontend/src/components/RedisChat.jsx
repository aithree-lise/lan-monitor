import { useState, useEffect } from 'react';
import TeamStatus from './TeamStatus';
import './RedisChat.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function RedisChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/redis/chat?count=50`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const getAgentColor = (name) => {
    switch (name.toLowerCase()) {
      case 'siegbert': return 'gold';
      case 'eugene': return 'red';
      case 'bubblebass': return 'green';
      case 'sandy': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) return <div>Loading chat...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="redis-chat">
      <h2>Team Chat</h2>
      <TeamStatus />
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <span className="message-ts">[{new Date(msg.ts).toLocaleString()}]</span>
            <span className="message-from" style={{ color: getAgentColor(msg.from) }}>{msg.from}:</span>
            <span className="message-text">{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
