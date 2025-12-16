import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Col, Input, Row, Spin, Typography, App as AntApp, Tag } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, EnvironmentOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text } = Typography;

export default function People() {
  const nav = useNavigate();
  const { message } = AntApp.useApp();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');

  // Загрузка рекомендаций
  useEffect(() => {
    let alive = true;
    async function loadRecommendations() {
      setLoading(true);
      try {
        const { data } = await http.get(Endpoints.RECOMMENDATIONS.LIST);
        if (alive) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        message.error('Не удалось загрузить рекомендации');
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadRecommendations();
    return () => { alive = false; };
  }, [message]);

  // Фильтрация (поиск)
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

  const startChat = async (userId, e) => {
    e.stopPropagation();

    try {
      const { data } = await http.get(Endpoints.CHATS.WITH_USER(userId));

      nav('/chats', { state: { chatId: data.id } });
    } catch (err) {
      console.error(err);
      message.error('Не удалось открыть чат');
    }
  };

  const openProfile = (userId, e) => {
    e.stopPropagation();
    nav(`/profile/${userId}`, { state: { from: '/' } });
  };

  const hideUser = async (userId, e) => {
    e.stopPropagation();

    try {
      setUsers(prev => prev.filter(u => u.id !== userId));

      await http.post(Endpoints.RECOMMENDATIONS.HIDE(userId));
      message.success('Пользователь скрыт');
    } catch (e) {
      message.error('Ошибка при скрытии');
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
  }

  return (
    <div className="tRecs">
      <style>{`
        .tRecsTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .tCard {
          border-radius: 18px !important;
          border: 1px solid #f0f0f0 !important;
          box-shadow: 0 4px 18px rgba(0,0,0,.04);
          overflow: hidden;
          cursor: pointer;
          height: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .tCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,.08);
        }

        .tCard :where(.ant-card-body) {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .tName { 
          font-weight: 700; 
          text-align: center; 
          line-height: 1.2;
          font-size: 16px;
          margin: 0;
        }
        
        .tCity { 
          font-size: 13px; 
          opacity: .7; 
          text-align: center;
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }

        .tMatch {
          border: 0;
          background: var(--accent) !important;
          color: #000 !important;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1;
          min-width: 60px;
          text-align: center;
        }

        .tChips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          min-height: 26px;
        }

        .tChip {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          background: #f5f5f5;
          border: 1px solid #ededed;
          color: rgba(0,0,0,.75);
          user-select: none;
        }

        .tActions {
          width: 100%;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .tWriteBtn {
          width: 100%;
          border-radius: 999px !important;
          height: 36px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #000 !important;
        }

        .tHideBtn {
          padding: 4px 0 !important;
          height: auto !important;
          color: rgba(0,0,0,.5) !important;
          font-size: 12px !important;
        }
        
        .tHideBtn:hover { 
          color: rgba(0,0,0,.75) !important; 
          background: transparent !important;
        }
      `}</style>

      <div className="tRecsTop">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Рекомендации
          </Title>
        </div>

        <Input
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать людей"
          prefix={<SearchOutlined />}
          style={{ width: 260, borderRadius: 20 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {filteredUsers.map((user) => {
          const profile = user.profile || {};
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;
          const compatibility = user.compatibility || 0;
          const interests = user.interests || [];

          return (
            <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                className="tCard"
                variant="borderless"
                onClick={(e) => openProfile(user.id, e)}
              >
                <Avatar
                  size={72}
                  src={profile.avatar_url}
                  icon={<UserOutlined />}
                  style={{
                    background: profile.avatar_url ? 'transparent' : '#f0f0f0',
                    color: '#000',
                    border: '2px solid #f0f0f0'
                  }}
                >
                  {fullName?.[0]?.toUpperCase()}
                </Avatar>

                <div className="tName">{fullName}</div>

                {profile.city && (
                  <div className="tCity">
                    <EnvironmentOutlined /> {profile.city}
                  </div>
                )}

                <div className="tMatch">
                  Совпадение {compatibility}%
                </div>

                <div className="tChips">
                  {interests.slice(0, 4).map((interest) => (
                    <span key={interest.id} className="tChip">
                      {interest.name}
                    </span>
                  ))}
                  {interests.length > 4 && (
                    <span className="tChip">
                      +{interests.length - 4}
                    </span>
                  )}
                </div>

                <div className="tActions">
                  <Button
                    className="tWriteBtn"
                    type="primary"
                    shape="round"
                    icon={<MessageOutlined />}
                    onClick={(e) => startChat(user.id, e)}
                    style={{ fontWeight: 600 }}
                  >
                    Написать
                  </Button>

                  <Button
                    className="tHideBtn"
                    type="text"
                    icon={<EyeInvisibleOutlined />}
                    onClick={(e) => hideUser(user.id, e)}
                  >
                    Скрыть
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {!filteredUsers.length && !loading && (
        <div style={{
          padding: 48,
          textAlign: 'center',
          background: '#fafafa',
          borderRadius: 12,
          marginTop: 24
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>👤</div>
          <Title level={4} style={{ marginBottom: 8 }}>
            Пользователи не найдены
          </Title>
          <Text type="secondary">
            Попробуйте изменить поисковый запрос или зайдите позже
          </Text>
        </div>
      )}
    </div>
  );
}
