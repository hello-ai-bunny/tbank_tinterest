import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Col, Input, Row, Spin, Typography, App as AntApp, Tag } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, EnvironmentOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text } = Typography;

const HIDDEN_USERS_KEY = 'hiddenUsers';

export default function People() {
  const nav = useNavigate();
  const { message } = AntApp.useApp();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentUserInterests, setCurrentUserInterests] = useState([]);
  const [query, setQuery] = useState('');
  const [hiddenIds, setHiddenIds] = useState(() => {
    // Загружаем скрытых пользователей из localStorage
    try {
      const hidden = JSON.parse(localStorage.getItem(HIDDEN_USERS_KEY) || '[]');
      return new Set(hidden);
    } catch {
      return new Set();
    }
  });

  // Загрузка текущего пользователя и его интересов
  useEffect(() => {
    let alive = true;
    async function loadCurrentUser() {
      try {
        const { data: userData } = await http.get(Endpoints.USERS.ME);
        const { data: interestsData } = await http.get(Endpoints.SURVEY.MY_INTERESTS);
        if (alive) {
          setCurrentUserInterests(interestsData || []);
        }
      } catch (e) {
        console.error('Ошибка загрузки текущего пользователя:', e);
      }
    }
    loadCurrentUser();
    return () => { alive = false; };
  }, []);

  // Загрузка списка пользователей
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

  // Функция для расчета процента совместимости
  const calculateCompatibility = (userInterests) => {
    if (!currentUserInterests.length || !userInterests.length) return 0;
    
    const myInterestIds = new Set(currentUserInterests.map(i => i.id));
    const userInterestIds = new Set(userInterests.map(i => i.id));
    
    // Находим пересечение интересов
    let commonCount = 0;
    userInterestIds.forEach(id => {
      if (myInterestIds.has(id)) commonCount++;
    });
    
    // Рассчитываем процент совпадения (формула Жаккара)
    const unionSize = new Set([...myInterestIds, ...userInterestIds]).size;
    return unionSize > 0 ? Math.round((commonCount / unionSize) * 100) : 0;
  };

  // Фильтрация и сортировка пользователей
  const filteredAndSortedUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // Сначала фильтруем по поисковому запросу и скрытым пользователям
    const filtered = users.filter((user) => {
      if (hiddenIds.has(user.id)) return false;
      
      const profile = user.profile || {};
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });

    // Затем добавляем процент совместимости и сортируем
    const withCompatibility = filtered.map(user => ({
      ...user,
      compatibility: calculateCompatibility(user.interests || [])
    }));

    // Сортируем по убыванию процента совместимости
    return withCompatibility.sort((a, b) => b.compatibility - a.compatibility);
  }, [users, query, currentUserInterests, hiddenIds]);

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
    
    // Добавляем пользователя в скрытые
    const newHiddenIds = new Set(hiddenIds);
    newHiddenIds.add(userId);
    setHiddenIds(newHiddenIds);
    
    // Сохраняем в localStorage
    localStorage.setItem(HIDDEN_USERS_KEY, JSON.stringify(Array.from(newHiddenIds)));
    
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
          font-weight: 700;
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
          <Text type="secondary">Сортировка по совместимости интересов</Text>
        </div>

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
        {filteredAndSortedUsers.map((user) => {
          const profile = user.profile || {};
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;
          const compatibility = user.compatibility || 0;
          const interests = user.interests || [];

          return (
            <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                className="tCard"
                bordered={false}
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

      {!filteredAndSortedUsers.length && !loading && (
        <div style={{ 
          padding: 48, 
          textAlign: 'center',
          background: '#fafafa',
          borderRadius: 12,
          marginTop: 24
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>👤</div>
          <Title level={4} style={{ marginBottom: 8 }}>
            {hiddenIds.size > 0 ? 'Все пользователи скрыты' : 'Пользователи не найдены'}
          </Title>
          <Text type="secondary">
            {hiddenIds.size > 0 
              ? 'Очистите список скрытых пользователей или измените поисковый запрос'
              : 'Попробуйте изменить поисковый запрос'
            }
          </Text>
        </div>
      )}
    </div>
  );
}