import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Col, Input, Row, Spin, Typography, App as AntApp, Tag } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, EnvironmentOutlined } from '@ant-design/icons';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text } = Typography;

export default function People() {
  const nav = useNavigate();
  const { message } = AntApp.useApp();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    async function loadUsers() {
      setLoading(true);
      try {
        const { data } = await http.get(Endpoints.USERS.LIST);
        if (alive) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        message.error('Не удалось загрузить список пользователей');
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadUsers();
    return () => { alive = false; };
  }, [message]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const profile = user.profile || {};
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [users, query]);

  const startChat = (userId) => {
    nav('/chats', { state: { toUserId: userId } });
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Пользователи
          </Title>
        </Col>
        <Col>
          <Input
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти пользователя..."
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {filteredUsers.map((user) => {
          const profile = user.profile || {};
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;

          return (
            <Col key={user.id} xxl={6} xl={8} lg={8} md={12} sm={12} xs={24}>
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar size={80} src={profile.avatar_url} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                  <Title level={5} style={{ margin: 0 }}>{fullName}</Title>
                  {profile.city && <Text type="secondary" style={{ marginTop: 4 }}><EnvironmentOutlined /> {profile.city}</Text>}
                  
                  <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, minHeight: 22 }}>
                    {user.interests.slice(0, 3).map(interest => (
                      <Tag key={interest.id}>{interest.name}</Tag>
                    ))}
                  </div>

                  <Button
                    type="primary"
                    icon={<MessageOutlined />}
                    onClick={() => startChat(user.id)}
                    style={{ marginTop: 8, width: '100%' }}
                  >
                    Написать
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {!filteredUsers.length && !loading && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">Пользователи не найдены</Text>
        </div>
      )}
    </div>
  );
}
