import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Layout, Avatar, Input, Button, List, Typography, Space, Spin,
  App as AntApp, Row, Col
} from 'antd';
import { SearchOutlined, SendOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';
import { useMediaQuery } from 'react-responsive';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Header, Content, Sider } = Layout;

function getAuthToken() {
  try {
    const raw = localStorage.getItem('authUser');
    if (!raw) return null;
    return JSON.parse(raw)?.access_token;
  } catch {
    return null;
  }
}

function getAuthUserId() {
    try {
        const raw = localStorage.getItem('authUser');
        if (!raw) return null;
        const token = JSON.parse(raw)?.access_token;
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub;
    } catch {
        return null;
    }
}

const ChatList = ({ chatList, selectedChat, onSelectChat }) => (
  <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Title level={4} style={{ margin: 0, marginBottom: 16 }}>Чаты</Title>
    <List
      dataSource={chatList}
      renderItem={(chat) => (
        <List.Item
          style={{ padding: 12, borderRadius: 12, cursor: 'pointer', backgroundColor: selectedChat?.id === chat.id ? '#f0f0f0' : 'transparent' }}
          onClick={() => onSelectChat(chat)}
        >
          <List.Item.Meta
            avatar={<Avatar size={48} src={chat.participant.avatar_url} icon={<UserOutlined />} />}
            title={<Text strong>{`${chat.participant.first_name || ''} ${chat.participant.last_name || ''}`.trim()}</Text>}
            description={<Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{chat.last_message?.text || '...'}</Paragraph>}
          />
        </List.Item>
      )}
    />
  </div>
);

const ChatWindow = ({ chat, messages, currentUserId, onSendMessage, onBack }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText('');
  };

  return (
    <Layout style={{ height: '100%', background: '#fff' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={onBack} style={{ marginRight: 8 }} />
        )}
        <Avatar size={40} src={chat.participant.avatar_url} icon={<UserOutlined />} />
        <div style={{ marginLeft: 12 }}>
          <Text strong>{`${chat.participant.first_name || ''} ${chat.participant.last_name || ''}`.trim()}</Text>
        </div>
      </Header>
      
      <Content style={{ padding: '16px', overflowY: 'auto', background: '#fafafa' }}>
        {messages.map((msg) => {
          const isMyMessage = msg.author_id === currentUserId;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ background: isMyMessage ? '#FFDC2E' : '#f0f0f0', borderRadius: 18, padding: '8px 14px', maxWidth: '70%' }}>
                <Text>{msg.text}</Text>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </Content>
      
      <div style={{ padding: '16px', borderTop: '1px solid #e5e5e5' }}>
        <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Напишите сообщение..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!messageText.trim()} />
        </Space.Compact>
      </div>
    </Layout>
  );
};


export default function Chats() {
  const location = useLocation();
  const { message } = AntApp.useApp();
  const ws = useRef(null);

  const [loading, setLoading] = useState(true);
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  
  const currentUserId = useMemo(() => getAuthUserId(), []);
  const toUserId = location.state?.toUserId;
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  // Load chat list
  useEffect(() => {
    let alive = true;
    async function loadChats() {
      setLoading(true);
      try {
        const { data } = await http.get('/chats');
        if (alive) {
          setChatList(Array.isArray(data) ? data : []);
        }
      } catch {
        message.error('Не удалось загрузить список чатов');
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadChats();
    return () => { alive = false; };
  }, [message]);

  // Handle opening a chat from recommendation or list
  useEffect(() => {
    if (!toUserId) return;
    async function openChatFromNav() {
      try {
        const { data } = await http.get(`/chats/${toUserId}`);
        setSelectedChat(data);
      } catch {
        message.error('Не удалось открыть чат');
      }
    }
    openChatFromNav();
  }, [toUserId, message]);
  
  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    let alive = true;
    async function loadMessages() {
      try {
        const { data } = await http.get(`/chats/${selectedChat.id}/messages`);
        if (alive) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch {
        message.error('Не удалось загрузить сообщения');
      }
    }
    loadMessages();
    return () => { alive = false; };
  }, [selectedChat, message]);

  // WebSocket connection
  useEffect(() => {
    if (!selectedChat) return;
    const token = getAuthToken();
    if (!token) {
      message.error('Требуется авторизация для чата');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/chats/${selectedChat.id}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log(`WebSocket connected to chat ${selectedChat.id}`);
    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };
    ws.current.onclose = () => console.log('WebSocket disconnected');
    ws.current.onerror = (err) => console.error('WebSocket error:', err);

    return () => ws.current?.close();
  }, [selectedChat, message]);

  const handleSendMessage = async (text) => {
    if (!text || !selectedChat) return;
    try {
      await http.post(`/chats/${selectedChat.id}/messages`, { text });
    } catch {
      message.error('Не удалось отправить сообщение');
    }
  };
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
  }

  if (isMobile) {
    return (
      <div style={{ height: 'calc(100vh - 112px)' }}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} messages={messages} currentUserId={currentUserId} onSendMessage={handleSendMessage} onBack={() => setSelectedChat(null)} />
        ) : (
          <ChatList chatList={chatList} selectedChat={selectedChat} onSelectChat={setSelectedChat} />
        )}
      </div>
    );
  }

  return (
    <Row style={{ height: 'calc(100vh - 112px)', flexWrap: 'nowrap' }}>
      <Col span={8} style={{ borderRight: '1px solid #e5e5e5', height: '100%'}}>
        <ChatList chatList={chatList} selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      </Col>
      <Col span={16} style={{ height: '100%'}}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} messages={messages} currentUserId={currentUserId} onSendMessage={handleSendMessage} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 72, marginBottom: 24 }}>💬</div>
              <Title level={3}>Выберите чат</Title>
            </div>
          </div>
        )}
      </Col>
    </Row>
  );
}
