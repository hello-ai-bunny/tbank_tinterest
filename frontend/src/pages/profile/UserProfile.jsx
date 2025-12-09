import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Avatar, Button, Card, Divider, Space, Tag, Typography, 
  Empty, Spin, Row, Col, App as AntApp 
} from 'antd';
import { 
  LeftOutlined, EnvironmentOutlined, 
  MessageOutlined, UserOutlined, MailOutlined
} from '@ant-design/icons';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text } = Typography;

export default function UserProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentUserInterests, setCurrentUserInterests] = useState([]);
  const [compatibility, setCompatibility] = useState(0);

  // Загрузка текущего пользователя и его интересов
  useEffect(() => {
    async function loadCurrentUserInterests() {
      try {
        const { data } = await http.get(Endpoints.SURVEY.MY_INTERESTS);
        setCurrentUserInterests(data || []);
      } catch (error) {
        console.error('Ошибка загрузки интересов текущего пользователя:', error);
      }
    }
    loadCurrentUserInterests();
  }, []);

  // Загрузка данных пользователя
  useEffect(() => {
    let alive = true;
    async function loadUser() {
      setLoading(true);
      try {
        const { data } = await http.get(`${Endpoints.USERS.LIST}?include_all=true`);
        if (alive) {
          const foundUser = Array.isArray(data) 
            ? data.find(u => u.id === id)
            : null;
          
          if (foundUser) {
            setUser(foundUser);
            
            // Рассчитываем совместимость
            const userInterests = foundUser.interests || [];
            if (currentUserInterests.length && userInterests.length) {
              const myInterestIds = new Set(currentUserInterests.map(i => i.id));
              const userInterestIds = new Set(userInterests.map(i => i.id));
              
              let commonCount = 0;
              userInterestIds.forEach(id => {
                if (myInterestIds.has(id)) commonCount++;
              });
              
              const unionSize = new Set([...myInterestIds, ...userInterestIds]).size;
              const calculatedCompatibility = unionSize > 0 
                ? Math.round((commonCount / unionSize) * 100) 
                : 0;
              setCompatibility(calculatedCompatibility);
            }
          }
        }
      } catch (error) {
        message.error('Не удалось загрузить данные пользователя');
      } finally {
        if (alive) setLoading(false);
      }
    }
    
    loadUser();
    return () => { alive = false; };
  }, [id, message, currentUserInterests]);

  const goBack = () => {
    if (location.state?.from) nav(-1);
    else nav('/', { replace: true });
  };

  const goChat = () => {
    nav('/chats', { state: { toUserId: id } });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button shape="round" icon={<LeftOutlined />} onClick={goBack} style={{ width: 'fit-content' }}>
          Назад
        </Button>
        <Card bordered={false}>
          <Empty description="Пользователь не найден" />
        </Card>
      </Space>
    );
  }

  const profile = user.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;
  const email = profile.email || user.email || '';
  const city = profile.city || '';
  const about = profile.about || '';
  const interests = user.interests || [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Button 
        shape="round" 
        icon={<LeftOutlined />} 
        onClick={goBack} 
        style={{ width: 'fit-content' }}
      >
        Назад
      </Button>

      <Card 
        bordered={false} 
        style={{ 
          borderRadius: 16,
          border: '1px solid #f0f0f0',
          boxShadow: '0 4px 18px rgba(0,0,0,.04)'
        }}
      >
        <Row gutter={24} align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Avatar
              size={92}
              src={profile.avatar_url}
              icon={!profile.avatar_url && <UserOutlined />}
              style={{ 
                background: profile.avatar_url ? 'transparent' : '#f0f0f0', 
                color: '#000',
                border: '3px solid #f0f0f0'
              }}
            />
          </Col>
          
          <Col flex="auto">
            <Space direction="vertical" size={8}>
              <Title level={3} style={{ margin: 0 }}>
                {fullName}
              </Title>
              
              <Space size={16} wrap>
                {city && (
                  <Space size={4}>
                    <EnvironmentOutlined />
                    <Text type="secondary">{city}</Text>
                  </Space>
                )}
                
                {email && (
                  <Space size={4}>
                    <MailOutlined />
                    <Text type="secondary">{email}</Text>
                  </Space>
                )}
              </Space>
            </Space>
          </Col>
          
          <Col>
            <Space direction="vertical" size={12} align="end">
              <Tag
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#000',
                  borderRadius: 999,
                  padding: '6px 20px',
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: 'center'
                }}
              >
                Совпадение {compatibility}%
              </Tag>
              
              <Button 
                type="primary" 
                icon={<MessageOutlined />} 
                onClick={goChat}
                style={{ 
                  minWidth: 140,
                  background: 'var(--accent)',
                  borderColor: 'var(--accent)',
                  color: '#000',
                  fontWeight: 600,
                  borderRadius: 999
                }}
              >
                Написать
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* Обо мне */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 12 }}>Обо мне</Title>
          {about ? (
            <Text style={{ 
              lineHeight: 1.6, 
              display: 'block', 
              whiteSpace: 'pre-wrap',
              fontSize: 15,
              padding: 16,
              background: '#fafafa',
              borderRadius: 12
            }}>
              {about}
            </Text>
          ) : (
            <Text type="secondary" style={{ 
              padding: 16,
              background: '#fafafa',
              borderRadius: 12,
              display: 'block'
            }}>
              Пользователь не добавил информацию о себе
            </Text>
          )}
        </div>

        {/* Интересы */}
        {interests.length > 0 && (
          <>
            <Divider />
            <div>
              <Title level={4} style={{ marginBottom: 16 }}>Интересы</Title>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {interests.map((interest) => (
                  <Tag
                    key={interest.id}
                    style={{
                      background: 'var(--accent)',
                      color: '#000',
                      borderRadius: 999,
                      padding: '6px 14px',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    {interest.name}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </Space>
  );
}