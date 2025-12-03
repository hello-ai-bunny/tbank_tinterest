import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Card, Tabs, Input, Button, Checkbox, Typography, Space } from 'antd';
import { jwtDecode } from 'jwt-decode';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text, Link } = Typography;
const STORAGE_KEY = 'authUser';

async function checkOnboardingComplete() {
  try {
    const [meRes, interestsRes] = await Promise.all([
      http.get(Endpoints.USERS.ME),
      http.get(Endpoints.SURVEY.MY_INTERESTS),
    ]);

    const meData = meRes?.data ?? {};
    const profile = meData.profile ?? meData; 

    const fullName = String(profile.full_name ?? '').trim();
    const city = String(profile.city ?? '').trim();

    const raw = interestsRes?.data;

    let ids = [];
    if (Array.isArray(raw)) {
      ids = raw
        .map((x) => (typeof x === 'number' ? x : x?.id))
        .filter(Boolean);
    } else if (Array.isArray(raw?.interest_ids)) {
      ids = raw.interest_ids.filter(Boolean);
    }

    const hasProfile = fullName.length > 0 && city.length > 0;
    const hasInterests = ids.length > 0;

    return hasProfile && hasInterests;
  } catch {
    return false;
  }
}

export default function Auth() {
  const nav = useNavigate();
  const { message } = AntApp.useApp();

  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [agree, setAgree] = useState(false);

  const trimmed = useMemo(() => username.trim(), [username]);

  const afterAuthRoute = async () => {
    const done = await checkOnboardingComplete();
    localStorage.setItem('onboardingDone', done ? '1' : '0');
    nav(done ? '/' : '/onboarding', { replace: true });
  };

  const doLogin = async () => {
    if (!trimmed) return message.warning('Введите логин');
    try {
      const { data } = await http.post(Endpoints.AUTH.LOGIN, { login: trimmed });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      jwtDecode(data.access_token);
      message.success('Вход выполнен');
      await afterAuthRoute();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Ошибка входа');
    }
  };

  const doRegister = async () => {
    if (!trimmed) return message.warning('Введите логин');
    if (!agree) return message.warning('Нужно согласиться с условиями');

    try {
      const { data } = await http.post(Endpoints.AUTH.REGISTER, { login: trimmed });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      jwtDecode(data.access_token);
      message.success('Аккаунт создан');
      await afterAuthRoute();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  return (
    <div className="auth">
      <Card className="auth__card" variant="borderless">
        <Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
          Добро пожаловать в<br />Tinterest!
        </Title>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
          Войдите или зарегистрируйтесь, чтобы найти единомышленников.
        </Text>

        <Tabs
          activeKey={tab}
          onChange={setTab}
          centered
          items={[
            {
              key: 'login',
              label: 'Вход',
              children: (
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text strong>Логин</Text>
                    <Input
                      placeholder="name@example.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onPressEnter={doLogin}
                    />
                  </div>
                  <Button type="primary" block onClick={doLogin}>Войти</Button>
                  <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                    Нет аккаунта? <Link onClick={() => setTab('register')}>Регистрация</Link>
                  </Text>
                </Space>
              ),
            },
            {
              key: 'register',
              label: 'Регистрация',
              children: (
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text strong>Логин</Text>
                    <Input
                      placeholder="name@example.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onPressEnter={doRegister}
                    />
                  </div>

                  <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)}>
                    Я согласен с условиями{' '}
                    <Link href="#" onClick={(e) => e.preventDefault()}>
                      Пользовательского соглашения
                    </Link>
                  </Checkbox>

                  <Button type="primary" block onClick={doRegister}>Создать аккаунт</Button>

                  <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                    Уже есть аккаунт? <Link onClick={() => setTab('login')}>Войти</Link>
                  </Text>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
