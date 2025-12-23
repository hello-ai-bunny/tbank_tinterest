import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Col, Input, Row, Spin, Typography, App as AntApp, Space } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, EnvironmentOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text } = Typography;

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

export default function People() {
  const nav = useNavigate();
  const { message } = AntApp.useApp();

  const currentUserId = useMemo(() => getAuthUserId(), []);

  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState('matches');

  const [users, setUsers] = useState([]);
  const [others, setOthers] = useState([]);
  const [loadingOthers, setLoadingOthers] = useState(false);

  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadRecommendations() {
      setLoading(true);
      try {
        const { data } = await http.get(Endpoints.RECOMMENDATIONS.LIST);
        if (alive) setUsers(Array.isArray(data) ? data : []);
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

  const loadOthers = async () => {
    setLoadingOthers(true);
    try {
      const myRes = await http.get(Endpoints.SURVEY.MY_INTERESTS);
      const myIds = new Set(
        (Array.isArray(myRes.data) ? myRes.data : []).map(x => x?.id).filter(Boolean).map(String)
      );

      const allRes = await http.get(`${Endpoints.USERS.LIST}?include_all=true`);
      const all = Array.isArray(allRes.data) ? allRes.data : [];

      const recommendedIds = new Set(users.map(u => String(u.id)));

      const zeroMatch = all
        .filter(u => String(u?.id) !== String(currentUserId))
        .filter(u => !recommendedIds.has(String(u?.id)))
        .filter(u => {
          const uInterests = Array.isArray(u?.interests) ? u.interests : [];
          const hasIntersection = uInterests.some(it => myIds.has(String(it?.id)));
          return !hasIntersection;
        })
        .map(u => ({ ...u, compatibility: 0 }));

      setOthers(zeroMatch);
    } catch (e) {
      message.error('Не удалось загрузить других пользователей');
      console.error(e);
    } finally {
      setLoadingOthers(false);
    }
  };

  const displayed = mode === 'matches' ? users : others;

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return displayed;

    return displayed.filter((user) => {
      const profile = user.profile || {};
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toLowerCase();
      const email = String(user.email || '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [displayed, query]);

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

  const openProfile = (user, e) => {
    e.stopPropagation();
    nav(`/profile/${user.id}`, { state: { from: '/', user } });
  };

  const hideUser = async (userId, e) => {
    e.stopPropagation();

    if (mode === 'matches') setUsers(prev => prev.filter(u => u.id !== userId));
    else setOthers(prev => prev.filter(u => u.id !== userId));

    try {
      await http.post(Endpoints.RECOMMENDATIONS.HIDE(userId));
      message.success('Пользователь скрыт');
    } catch {
    }
  };

  const toggleMode = async () => {
    if (mode === 'matches') {
      setMode('others');
      if (others.length === 0) await loadOthers();
    } else {
      setMode('matches');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
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
          flex-direction:column;
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
          flex:1;
          width:100%;
        }
        .tName { 
          font-weight: 700; 
          text-align: center; 
          line-height: 1.2;
          font-size: 16px;
          margin: 0;
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
        }
        .tHideBtn:hover { 
          color: rgba(0,0,0,.75) !important; 
          background: transparent !important;
        }
      `}</style>

      <div className="tRecsTop">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {mode === 'matches' ? 'Рекомендации' : 'Другие люди'}
          </Title>
        </div>

        <Space wrap>
          <Input
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Искать людей"
            prefix={<SearchOutlined />}
            style={{ width: 260, borderRadius: 20 }}
          />

          <Button onClick={toggleMode} loading={loadingOthers} style={{ borderRadius: 20 }}>
            {mode === 'matches' ? 'Посмотреть других' : 'Показать совпадения'}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {filteredUsers.map((user) => {
          const profile = user.profile || {};
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;
          const compatibility = user.compatibility || 0;
          const interests = user.interests || [];

          return (
            <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
              <Card className="tCard" variant="borderless" onClick={(e) => openProfile(user, e)}>
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
                  {mode === 'matches' ? `Совпадение ${compatibility}%` : 'Без совпадений'}
                </div>

                <div className="tChips">
                  {interests.slice(0, 4).map((interest) => (
                    <span key={interest.id} className="tChip">
                      {interest.name}
                    </span>
                  ))}
                  {interests.length > 4 && (
                    <span className="tChip">+{interests.length - 4}</span>
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
          borderRadius: 12,
          marginTop: 24
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>👤</div>
          <Title level={4} style={{ marginBottom: 8 }}>
            Пользователи не найдены
          </Title>
          <Text type="secondary">
            Попробуйте изменить поисковый запрос или переключить режим
          </Text>
        </div>
      )}
    </div>
  );
}
