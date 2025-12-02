import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Col, Input, Row, Space, Tag, Typography } from 'antd';
import { SearchOutlined, UserOutlined, EyeInvisibleOutlined, EnvironmentOutlined  } from '@ant-design/icons';

const { Title, Text } = Typography;

const USERS_KEY = 'mockUsers';
const AUTH_KEY = 'authUser';
const SCROLL_KEY = 'recsScrollY';

function safeParse(json, fallback) {
  try {
    return JSON.parse(json ?? '');
  } catch {
    return fallback;
  }
}

function getUsersRaw() {
  return safeParse(localStorage.getItem(USERS_KEY) || '[]', []);
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getAuthUser() {
  return safeParse(localStorage.getItem(AUTH_KEY) || 'null', null);
}

function normalizeUser(u) {
  const p = u?.profile || {};

  const firstName = String(p.firstName ?? u.firstName ?? '').trim();
  const lastName = String(p.lastName ?? u.lastName ?? '').trim();

  const mergedProfile = {
    ...p,
    firstName: firstName || p.firstName || '',
    lastName: lastName || p.lastName || '',
    email: p.email ?? u.email,
    telegram: p.telegram ?? u.telegram,
    city: p.city ?? u.city,
    about: p.about ?? u.about,
    photoBase64: p.photoBase64 ?? u.photoBase64,
    interests: p.interests ?? u.interests,
    interestsByGroup: p.interestsByGroup ?? u.interestsByGroup,
  };

  const hasAny =
    (mergedProfile.firstName && mergedProfile.firstName.trim()) ||
    (mergedProfile.lastName && mergedProfile.lastName.trim()) ||
    (mergedProfile.about && String(mergedProfile.about).trim()) ||
    (mergedProfile.city && String(mergedProfile.city).trim()) ||
    (Array.isArray(mergedProfile.interests) && mergedProfile.interests.length) ||
    (mergedProfile.email && String(mergedProfile.email).trim()) ||
    (mergedProfile.telegram && String(mergedProfile.telegram).trim()) ||
    (mergedProfile.photoBase64 && String(mergedProfile.photoBase64).trim());

  if (!hasAny) return u;
  return { ...u, profile: mergedProfile };
}

function displayName(u) {
  const p = u?.profile || {};
  const full = [p.firstName, p.lastName]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(' ');
  return full || 'Пользователь';
}

function getInterests(u) {
  const p = u?.profile || {};
  if (Array.isArray(p.interests) && p.interests.length) return p.interests;

  const byGroup = p.interestsByGroup || {};
  const flat = [];
  Object.values(byGroup).forEach((arr) => (arr || []).forEach((x) => flat.push(x)));
  return flat;
}

function calcMatchPercent(a = [], b = []) {
  const A = new Set(a.map((x) => String(x).toLowerCase()));
  const B = new Set(b.map((x) => String(x).toLowerCase()));
  if (!A.size || !B.size) return 0;

  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;

  const union = new Set([...A, ...B]).size;
  return Math.round((inter / union) * 100);
}

export default function People() {
  const nav = useNavigate();

  const [users, setUsersState] = useState([]);
  const [q, setQ] = useState('');
  const [hiddenIds, setHiddenIds] = useState(() => new Set());

  const me = useMemo(() => getAuthUser(), []);
  const myInterests = useMemo(() => getInterests(me), [me]);

  useEffect(() => {
    const raw = getUsersRaw();
    const normalized = raw.map(normalizeUser);

    const changed = JSON.stringify(raw) !== JSON.stringify(normalized);
    if (changed) setUsers(normalized);

    const filtered = me ? normalized.filter((u) => u.id !== me.id) : normalized;
    setUsersState(filtered);
  }, [me]);

  useEffect(() => {
    const y = sessionStorage.getItem(SCROLL_KEY);
    if (y) {
      sessionStorage.removeItem(SCROLL_KEY);
      requestAnimationFrame(() => window.scrollTo(0, Number(y)));
    }
  }, []);

  const openProfile = (id) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    nav(`/profile/${id}`, { state: { from: 'recs' } });
  };

  const hideUser = (id) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(String(id));
      return next;
    });
  };

  const visibleUsers = useMemo(() => {
    const query = q.trim().toLowerCase();

    return users
      .filter((u) => !hiddenIds.has(String(u.id)))
      .filter((u) => {
        if (!query) return true;
        const name = displayName(u).toLowerCase();
        const login = String(u.username || '').toLowerCase();
        return name.includes(query) || login.includes(query);
      });
  }, [users, hiddenIds, q]);

  return (
    <div className="tRecs">
      <style>{`
        .tRecsTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .tCard {
          border-radius: 18px !important;
          border: 1px solid #f0f0f0 !important;
          box-shadow: 0 4px 18px rgba(0,0,0,.04);
          overflow: hidden;
          cursor: pointer;
          height: 100%;
        }

        .tCard :where(.ant-card-body){
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .tName { font-weight: 700; text-align: center; line-height: 1.2; }
        .tCity { font-size: 12px; opacity: .7; text-align: center;}

        .tMatch {
          border: 0;
          background: var(--accent);
          color: #000;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
        }

        .tChips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          min-height: 24px;
        }

        .tChip {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f5f5f5;
          border: 1px solid #ededed;
          color: rgba(0,0,0,.75);
          user-select: none;
        }

        .tActions {
          width: 100%;
          margin-top: 6px;
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
        }

        .tHideBtn {
          padding: 0 !important;
          height: auto !important;
          color: rgba(0,0,0,.5) !important;
        }
        .tHideBtn:hover { color: rgba(0,0,0,.75) !important; }
      `}</style>

      <div className="tRecsTop">
        <Title level={3} style={{ margin: 0 }}>
          Рекомендации
        </Title>

        <Input
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Искать людей"
          prefix={<SearchOutlined />}
          style={{ width: 260, borderRadius: 10 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {visibleUsers.map((u) => {
          const p = u.profile || {};
          const name = displayName(u);
          const city = String(p.city || '').trim();
          const interests = getInterests(u).slice(0, 5);
          const match = calcMatchPercent(myInterests, interests);

          return (
            <Col key={u.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                className="tCard"
                variant="borderless"
                onClick={() => openProfile(u.id)}
              >
                <Avatar
                  size={72}
                  src={p.photoBase64 || undefined}
                  style={{ background: '#f0f0f0', color: '#000' }}
                >
                  {name?.[0]?.toUpperCase()}
                </Avatar>

                <div className="tName">{name}</div>

                {!!city && <div className="tCity">{<EnvironmentOutlined  />} {city}</div>}
                

                <div className="tMatch">Совпадение {match}%</div>

                <div className="tChips">
                  {interests.map((x) => (
                    <span key={x} className="tChip">
                      {x}
                    </span>
                  ))}
                </div>

                <div className="tActions">
                  <Button
                    className="tWriteBtn"
                    type="primary"
                    shape="round"
                    icon={<UserOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      nav('/chats', { state: { toUserId: u.id } });
                    }}
                     style={{ fontWeight: 600 }}
                  >
                    Написать
                  </Button>

                  <Button
                    className="tHideBtn"
                    type="text"
                    icon={<EyeInvisibleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      hideUser(u.id);
                    }}
                  >
                    Скрыть
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {!visibleUsers.length && (
        <div style={{ padding: 24 }}>
          <Text type="secondary">Никого не найдено</Text>
        </div>
      )}
    </div>
  );
}
