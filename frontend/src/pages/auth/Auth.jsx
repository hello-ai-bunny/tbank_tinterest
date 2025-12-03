import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Input, Button, Checkbox, Typography, Space, message } from 'antd';
import { jwtDecode } from 'jwt-decode';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

const { Title, Text, Link } = Typography;

const STORAGE_KEY = 'authUser';

export default function Auth() {
    const nav = useNavigate();

    const [tab, setTab] = useState('login');
    const [username, setUsername] = useState('');
    const [agree, setAgree] = useState(false);

    const trimmed = useMemo(() => username.trim(), [username]);

    const doLogin = async () => {
        if (!trimmed) return message.warning('Введите логин');

        try {
            const { data } = await http.post(Endpoints.AUTH.LOGIN, { login: trimmed });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            const decoded = jwtDecode(data.access_token);
            message.success('Вход выполнен');
            localStorage.setItem('onboardingDone', '0');
            nav('/onboarding', { replace: true });
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
            const decoded = jwtDecode(data.access_token);
            message.success('Аккаунт создан');
            localStorage.setItem('onboardingDone', '0');
            nav('/onboarding', { replace: true });
        } catch (error) {
            message.error(error.response?.data?.detail || 'Ошибка регистрации');
        }
    };

    return (
        <div className="auth">
            <Card className="auth__card" bordered={false}>
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
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <div>
                                        <Text strong>Логин</Text>
                                        <Input
                                            placeholder="name@example.com"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onPressEnter={doLogin}
                                        />
                                    </div>

                                    <Button type="primary" block onClick={doLogin}>
                                        Войти
                                    </Button>

                                    <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                                        Нет аккаунта?{' '}
                                        <Link onClick={() => setTab('register')}>Регистрация</Link>
                                    </Text>
                                </Space>
                            ),
                        },
                        {
                            key: 'register',
                            label: 'Регистрация',
                            children: (
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
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

                                    <Button type="primary" block onClick={doRegister}>
                                        Создать аккаунт
                                    </Button>

                                    <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                                        Уже есть аккаунт?{' '}
                                        <Link onClick={() => setTab('login')}>Войти</Link>
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
