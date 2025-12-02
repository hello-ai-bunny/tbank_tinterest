import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Input, Button, Checkbox, Typography, Space, message } from 'antd';

const { Title, Text, Link } = Typography;

const STORAGE_KEY = 'authUser';
const USERS_KEY = 'mockUsers';

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch {
        return [];
    }
}

// to do
async function gg() {
    const response = await fetch("https://randomuser.me/api/")

    const json = await response.json();
    console.log(json);
} 

function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export default function Auth() {
    const nav = useNavigate();

    const [tab, setTab] = useState('login');
    const [username, setUsername] = useState('');
    const [agree, setAgree] = useState(false);

    const trimmed = useMemo(() => username.trim(), [username]);

    const doLogin = () => {
        if (!trimmed) return message.warning('Введите логин');

        const users = getUsers();
        const found = users.find(u => u.username.toLowerCase() === trimmed.toLowerCase());

        if (!found) {
            return message.error('Такого логина нет. Нажмите “Регистрация” и создайте.');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        message.success('Вход выполнен');
        localStorage.setItem('onboardingDone', '0');
        nav(`/profile/${found.id}`, { replace: true });
    };

    const doRegister = () => {
        if (!trimmed) return message.warning('Введите логин');
        if (!agree) return message.warning('Нужно согласиться с условиями');

        const users = getUsers();
        const exists = users.some(u => u.username.toLowerCase() === trimmed.toLowerCase());
        if (exists) return message.error('Такой логин уже существует. Перейдите на “Вход”.');

        const newUser = { id: Date.now(), username: trimmed };
        users.push(newUser);
        setUsers(users);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

        message.success('Аккаунт создан');
        localStorage.setItem('onboardingDone', '0');
        nav(`/profile/${newUser.id}`, { replace: true });
        gg();
        console.log("y");
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
