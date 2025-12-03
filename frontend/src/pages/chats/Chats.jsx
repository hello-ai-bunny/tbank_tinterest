import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Layout,
  Avatar,
  Input,
  Button,
  List,
  Badge,
  Typography,
  Space,
  Card,
  Divider,
  Row,
  Col,
  message,
} from 'antd';
import {
  SearchOutlined,
  SendOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Header, Content, Sider } = Layout;

// Константы для localStorage
const AUTH_KEY = 'authUser';
const USERS_KEY = 'mockUsers';
const CHATS_KEY = 'chats';

// Вспомогательные функции
function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function getChats() {
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveChats(chats) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

// Генерация уникального ID для чата
function generateChatId(userId1, userId2) {
  return [userId1, userId2].sort((a, b) => a - b).join('_');
}

// Получение информации о пользователе
function getUserInfo(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  
  const profile = user.profile || {};
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  
  return {
    id: user.id,
    username: user.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: fullName || user.username,
    photoBase64: profile.photoBase64,
    city: profile.city,
  };
}

export default function Chats() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chats, setChats] = useState({});
  const [users, setUsers] = useState([]);
  
  const currentUser = useMemo(() => getAuthUser(), []);
  
  // Получаем ID пользователя для чата из location state
  const toUserId = useMemo(() => {
    return location.state?.toUserId || null;
  }, [location.state]);
  
  // Загрузка данных
  useEffect(() => {
    if (!currentUser) {
      message.error('Требуется авторизация');
      navigate('/auth');
      return;
    }
    
    const loadedUsers = getUsers();
    const filteredUsers = loadedUsers.filter(u => u.id !== currentUser.id);
    setUsers(filteredUsers);
    
    const loadedChats = getChats();
    setChats(loadedChats);
    
    // Если перешли с карточки пользователя, открываем чат с ним
    if (toUserId) {
      const chatId = generateChatId(currentUser.id, toUserId);
      setSelectedChatId(chatId);
      
      // Создаем пустой чат, если его нет
      if (!loadedChats[chatId]) {
        const newChats = {
          ...loadedChats,
          [chatId]: {
            participants: [currentUser.id, toUserId],
            messages: [],
            unreadCount: { [currentUser.id]: 0 }
          }
        };
        setChats(newChats);
        saveChats(newChats);
      }
    }
  }, [currentUser, toUserId, navigate]);
  
  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats]);
  
  // Обработка отправки сообщения
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChatId || !currentUser) return;
    
    const newMessage = {
      id: Date.now(),
      senderId: currentUser.id,
      text: messageText.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    const updatedChats = { ...chats };
    const chat = updatedChats[selectedChatId];
    
    if (!chat) {
      // Создаем новый чат
      const participantIds = selectedChatId.split('_').map(Number);
      const otherUserId = participantIds.find(id => id !== currentUser.id);
      
      updatedChats[selectedChatId] = {
        participants: participantIds,
        messages: [newMessage],
        unreadCount: { 
          [currentUser.id]: 0,
          [otherUserId]: 1 
        }
      };
    } else {
      // Добавляем сообщение в существующий чат
      chat.messages.push(newMessage);
      
      // Обновляем счетчик непрочитанных для другого пользователя
      const otherUserId = chat.participants.find(id => id !== currentUser.id);
      chat.unreadCount = {
        ...chat.unreadCount,
        [otherUserId]: (chat.unreadCount[otherUserId] || 0) + 1,
      };
    }
    
    setChats(updatedChats);
    saveChats(updatedChats);
    setMessageText('');
  };
  
  // Обработка нажатия Enter (без Shift - отправка)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Открытие чата с пользователем
  const openChat = (userId) => {
    const chatId = generateChatId(currentUser.id, userId);
    
    // Создаем чат, если его нет
    if (!chats[chatId]) {
      const newChats = {
        ...chats,
        [chatId]: {
          participants: [currentUser.id, userId],
          messages: [],
          unreadCount: { [currentUser.id]: 0 }
        }
      };
      setChats(newChats);
      saveChats(newChats);
    }
    
    setSelectedChatId(chatId);
    
    // Помечаем сообщения как прочитанные
    if (chats[chatId]?.unreadCount[currentUser.id] > 0) {
      const updatedChats = { ...chats };
      updatedChats[chatId].unreadCount[currentUser.id] = 0;
      setChats(updatedChats);
      saveChats(updatedChats);
    }
  };
  
  // Получение информации о выбранном чате
  const selectedChat = selectedChatId ? chats[selectedChatId] : null;
  const otherUserId = selectedChat?.participants?.find(id => id !== currentUser.id);
  const otherUserInfo = otherUserId ? getUserInfo(otherUserId) : null;
  
  // Фильтрация пользователей для списка чатов
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const userInfo = getUserInfo(user.id);
      return (
        userInfo.fullName.toLowerCase().includes(query) ||
        userInfo.username.toLowerCase().includes(query) ||
        userInfo.city?.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);
  
  // Подготовка списка чатов с последним сообщением
  const chatList = useMemo(() => {
    return filteredUsers.map(user => {
      const userInfo = getUserInfo(user.id);
      const chatId = generateChatId(currentUser.id, user.id);
      const chat = chats[chatId];
      const lastMessage = chat?.messages?.[chat.messages.length - 1];
      const unreadCount = chat?.unreadCount?.[currentUser.id] || 0;
      
      return {
        id: user.id,
        chatId,
        userInfo,
        lastMessage: lastMessage?.text || 'Начните диалог',
        lastMessageTime: lastMessage?.timestamp,
        unreadCount,
        isOnline: Math.random() > 0.5, // Заглушка для статуса онлайн
      };
    });
  }, [filteredUsers, chats, currentUser.id]);
  
  // Стили для сообщений
  const messageStyles = {
    container: {
      maxWidth: '100%',
      marginBottom: 16,
      display: 'flex',
      flexDirection: 'column',
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#FFDC2E',
      color: '#000',
      borderRadius: '18px 18px 4px 18px',
      padding: '12px 16px',
      maxWidth: '70%',
      marginLeft: 'auto',
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#f0f0f0',
      color: '#000',
      borderRadius: '18px 18px 18px 4px',
      padding: '12px 16px',
      maxWidth: '70%',
    },
    time: {
      fontSize: '11px',
      color: '#888',
      marginTop: 4,
    },
  };
  
  return (
    <Layout style={{ height: 'calc(100vh - 112px)', background: '#fff' }}>
      {/* Левая панель - список чатов */}
      <Sider
        width={320}
        style={{
          background: '#fff',
          borderRight: '1px solid #e5e5e5',
          padding: 16,
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>Чаты</Title>
          
          <Input
            placeholder="Поиск чатов..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderRadius: 12 }}
          />
          
          <Divider style={{ margin: '8px 0' }} />
          
          <List
            dataSource={chatList}
            style={{ width: '100%' }}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: selectedChatId === item.chatId ? '#f9f9f9' : 'transparent',
                  border: selectedChatId === item.chatId ? '1px solid #e0e0e0' : 'none',
                  marginBottom: 8,
                }}
                onClick={() => openChat(item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Badge
                    dot={item.isOnline}
                    color="green"
                    offset={[-4, 32]}
                  >
                    <Avatar
                      size={48}
                      src={item.userInfo.photoBase64}
                      icon={!item.userInfo.photoBase64 && <UserOutlined />}
                      style={{ 
                        background: item.userInfo.photoBase64 ? 'transparent' : '#f0f0f0',
                        color: '#000',
                      }}
                    />
                  </Badge>
                  
                  <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 14 }}>
                        {item.userInfo.fullName}
                      </Text>
                      {item.unreadCount > 0 && (
                        <Badge
                          count={item.unreadCount}
                          style={{ backgroundColor: '#FFDC2E', color: '#000' }}
                        />
                      )}
                    </div>
                    
                    <Paragraph
                      ellipsis={{ rows: 1 }}
                      style={{ 
                        margin: 0,
                        fontSize: 12,
                        color: '#666',
                        maxWidth: '100%',
                      }}
                    >
                      {item.lastMessage}
                    </Paragraph>
                    
                    {item.lastMessageTime && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(item.lastMessageTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: 'Нет активных чатов' }}
          />
        </Space>
      </Sider>
      
      {/* Правая часть - сам чат */}
      <Layout style={{ background: '#fff' }}>
        {selectedChat ? (
          <>
            {/* Заголовок чата */}
            <Header
              style={{
                background: '#fff',
                borderBottom: '1px solid #e5e5e5',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setSelectedChatId(null)}
                  style={{ marginRight: 12, display: ['none', 'none', 'inline-block'] }}
                />
                
                <Avatar
                  size={40}
                  src={otherUserInfo?.photoBase64}
                  icon={!otherUserInfo?.photoBase64 && <UserOutlined />}
                  style={{ 
                    background: otherUserInfo?.photoBase64 ? 'transparent' : '#f0f0f0',
                    color: '#000',
                    marginRight: 12,
                  }}
                />
                
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {otherUserInfo?.fullName || 'Пользователь'}
                  </Text>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {otherUserInfo?.city && `📍 ${otherUserInfo.city}`}
                    <span style={{ marginLeft: 8, color: '#52c41a' }}>● онлайн</span>
                  </div>
                </div>
              </div>
            </Header>
            
            {/* Область сообщений */}
            <Content
              style={{
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                background: '#fafafa',
              }}
            >
              {selectedChat.messages.length === 0 ? (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#999',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                  <Title level={4} style={{ color: '#666' }}>
                    Начните диалог
                  </Title>
                  <Text type="secondary">
                    Напишите первое сообщение пользователю {otherUserInfo?.fullName}
                  </Text>
                </div>
              ) : (
                selectedChat.messages.map((msg) => {
                  const isMyMessage = msg.senderId === currentUser.id;
                  const messageTime = new Date(msg.timestamp);
                  
                  return (
                    <div
                      key={msg.id}
                      style={messageStyles.container}
                    >
                      <div style={isMyMessage ? messageStyles.myMessage : messageStyles.otherMessage}>
                        <Text>{msg.text}</Text>
                        <div style={messageStyles.time}>
                          {messageTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Content>
            
            {/* Поле ввода сообщения */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e5e5',
                background: '#fff',
              }}
            >
              <Row gutter={12} align="middle">
                <Col flex="auto">
                  <TextArea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Напишите сообщение..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ borderRadius: 12 }}
                  />
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    style={{ 
                      borderRadius: 12,
                      height: 40,
                      width: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </Col>
              </Row>
            </div>
          </>
        ) : (
          /* Экран при выборе чата */
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: 24,
            color: '#999',
          }}>
            <div style={{ fontSize: 72, marginBottom: 24 }}>💬</div>
            <Title level={3} style={{ color: '#666', marginBottom: 12 }}>
              Выберите чат
            </Title>
            <Text type="secondary" style={{ maxWidth: 400 }}>
              Выберите диалог из списка слева или начните новый, нажав на пользователя в рекомендациях
            </Text>
          </div>
        )}
      </Layout>
    </Layout>
  );
}