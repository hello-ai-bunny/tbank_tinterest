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

  const startChat = (userId, e) => {
    e.stopPropagation();
    nav('/chats', { state: { toUserId: userId } });
  };

  const openProfile = (userId, e) => {
    e.stopPropagation();
    nav(`/profile/${userId}`);
  };

  const hideUser = (userId, e) => {
    e.stopPropagation();
    message.success('Пользователь скрыт');
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
          display: flex;
          flex-direction: column;
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
          flex: 1;
          width: 100%;
        }

        .tAvatarSection {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
          flex-shrink: 0;
        }

        .tName { 
          font-weight: 700; 
          text-align: center; 
          line-height: 1.2;
          font-size: 16px;
          margin: 0;
          width: 100%;
          height: 38px; 
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tCity { 
          font-size: 13px; 
          opacity: .7; 
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin: 0;
          height: 20px; 
          width: 100%;
          flex-shrink: 0;
        }

        .tChipsContainer {
          width: 100%;
          flex: 1;
          min-height: 60px;
          max-height: 60px;
          overflow: hidden;
          position: relative;
        }

        .tChips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
          max-height: 55px; 
          overflow: hidden;
        }

        .tChip {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          background: #f5f5f5;
          border: 1px solid #ededed;
          color: rgba(0,0,0,.75);
          user-select: none;
          flex-shrink: 0;
          line-height: 1.3;
        }

        .tActions {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-top: auto;
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
          width: 100%;
          text-align: center;
        }
        
        .tHideBtn:hover { 
          color: rgba(0,0,0,.75) !important; 
          background: transparent !important;
        }

        .tEmptyCity {
          opacity: 0.3;
          font-size: 13px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tEmptyInterests {
          opacity: 0.3;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          background: #f5f5f5;
          border: 1px dashed #e0e0e0;
          color: rgba(0,0,0,.75);
          line-height: 1.3;
        }
      `}</style>

      <div className="tRecsTop">
        <Title level={3} style={{ margin: 0 }}>
          Пользователи
        </Title>

        <Input
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать людей"
          prefix={<SearchOutlined />}
          style={{ width: 260, borderRadius: 10 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {filteredUsers.map((user) => {
          const profile = user.profile || {};
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;
          const interests = user.interests || [];
          const displayCity = profile.city || null;

          return (
            <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                className="tCard"
                onClick={(e) => openProfile(user.id, e)}
              >
                <div className="tAvatarSection">
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

                  <div className="tName" title={fullName}>
                    {fullName}
                  </div>

                  <div className="tCity">
                    {displayCity ? (
                      <>
                        <EnvironmentOutlined /> {displayCity}
                      </>
                    ) : (
                      <span className="tEmptyCity">Город не указан</span>
                    )}
                  </div>
                </div>

                <div className="tChipsContainer">
                  <div className="tChips">
                    {interests.length > 0 ? (
                      interests.slice(0, 6).map((interest) => (
                        <span key={interest.id} className="tChip">
                          {interest.name}
                        </span>
                      ))
                    ) : (
                      <span className="tEmptyInterests">
                        Нет интересов
                      </span>
                    )}
                  </div>
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
            Попробуйте изменить поисковый запрос
          </Text>
        </div>
      )}
    </div>
  );
}
