import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Divider, Space, Tag, Typography, Empty } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const USERS_KEY = 'mockUsers';
const AUTH_KEY = 'authUser';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

function calcMatchPercent(a = [], b = []) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;

  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;

  const union = new Set([...A, ...B]).size;
  return Math.round((inter / union) * 100);
}

export default function UserProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const me = useMemo(() => getAuthUser(), []);
  const users = useMemo(() => getUsers(), []);

  const user = useMemo(() => {
    const numId = Number(id);
    return users.find((u) => u.id === numId) || null;
  }, [users, id]);

  const profile = user?.profile || {};

  const name =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
      : user?.username || 'Пользователь';

  const username = user?.username ? `@${user.username}` : '';

  const city = (profile?.city || '').trim();
  const about = (profile?.about || '').trim();
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];

  const email = (profile?.email || '').trim();
  const telegram = (profile?.telegram || '').trim();

  const hasAbout = Boolean(about);
  const hasInterests = interests.length > 0;
  const hasContacts = Boolean(email || telegram);

  const match = calcMatchPercent(me?.profile?.interests || [], interests);

  const goBack = () => {
    if (loc.state?.from) nav(-1);
    else nav('/', { replace: true });
  };

  const goChat = () => {
    nav('/chats', { state: { toUserId: user?.id } });
  };

  if (!user) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Button shape="round" icon={<LeftOutlined />} onClick={goBack} style={{ width: 'fit-content' }}>
          Назад
        </Button>
        <Card variant="outlined">
          <Empty description="Пользователь не найден" />
        </Card>
      </Space>
    );
  }

  return (
    <Space orientation="vertical" size={14} style={{ width: '100%' }}>
      <Button shape="round" icon={<LeftOutlined />} onClick={goBack} style={{ width: 'fit-content' }}>
        Назад
      </Button>

      <Card variant="borderless" style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar
            size={92}
            src={profile?.photoBase64 || undefined}
            style={{ background: '#f0f0f0', color: '#000' }}
          >
            {name?.[0]?.toUpperCase()}
          </Avatar>

          <div style={{ flex: 1, minWidth: 220 }}>
            <Space size={10} wrap align="center" style={{ marginBottom: 2 }}>
              <Title level={3} style={{ margin: 0 }}>
                {name}
              </Title>

              <Tag
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#000',
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontWeight: 600,
                  marginLeft: 20,
                }}
              >
                Совпадение {match}%
              </Tag>
            </Space>

            {username && (
              <Text type="secondary" style={{ display: 'block', lineHeight: 1.3 }}>
                {username}
              </Text>
            )}

            {city && (
              <Text type="secondary" style={{ display: 'block', lineHeight: 1.3 }}>
                {city}
              </Text>
            )}
          </div>

          <Button type="primary" shape="round" onClick={goChat} style={{ minWidth: 140, fontWeight: 600 }}>
            Написать
          </Button>
        </div>

        <Divider style={{ margin: '18px 0' }} />

        {hasAbout && (
          <>
            <Title level={4} style={{ marginTop: 0 }}>
              Обо мне
            </Title>
            <Text type="secondary" style={{ lineHeight: 1.6, display: 'block' }}>
              {about}
            </Text>
            <div style={{ height: 18 }} />
          </>
        )}

        {hasContacts && (
          <>
            <Title level={4} style={{ marginTop: 0 }}>
              Контакты
            </Title>
            <Space orientation="vertical" size={6}>
              {email && (
                <Text type="secondary">
                  <b style={{ color: '#000' }}>Email:</b> {email}
                </Text>
              )}
              {telegram && (
                <Text type="secondary">
                  <b style={{ color: '#000' }}>Телеграм:</b> {telegram}
                </Text>
              )}
            </Space>
            <div style={{ height: 18 }} />
          </>
        )}

        {hasInterests && (
          <>
            <Title level={4} style={{ marginTop: 0 }}>
              Интересы
            </Title>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {interests.map((i) => (
                <Tag
                  key={i}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#000',
                    borderRadius: 999,
                    padding: '4px 10px',
                  }}
                >
                  {i}
                </Tag>
              ))}
            </div>
          </>
        )}
      </Card>
    </Space>
  );
}
