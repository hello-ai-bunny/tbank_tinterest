import { useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Typography } from 'antd';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { TeamOutlined, MessageOutlined } from '@ant-design/icons';


const AUTH_KEY = 'authUser';

export default function Shell() {
  const { Header, Sider, Content } = Layout;
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const user = localStorage.getItem(AUTH_KEY);
    if (!user) {
      nav('/auth', { replace: true });
      return;
    }

    const done = localStorage.getItem('onboardingDone') === '1';

    if (done && loc.pathname === '/onboarding') {
      nav('/', { replace: true });
    }
  }, [loc.pathname, nav]);

  const selectedKey = loc.pathname.startsWith('/chats') ? 'chats' : 'recs';

  const profileMenu = {
    items: [
      { key: 'settings', label: 'Настройки', onClick: () => nav('/settings') },
      {
        key: 'logout',
        label: 'Выход',
        onClick: () => {
          localStorage.removeItem(AUTH_KEY);
          localStorage.removeItem('onboardingDone');
          nav('/auth', { replace: true });
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="light"
        style={{ borderRight: '1px solid #e5e5e5', background: '#fff' }}
      >
        <div style={{ padding: '12px 16px' }}>
          <Typography.Text strong>Tinterest</Typography.Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            { key: 'recs', label: <Link to="/">{<TeamOutlined />} Рекомендации</Link> },
            { key: 'chats', label: <Link to="/chats">{<MessageOutlined />} Чаты</Link> },
          ]}
        />
      </Sider>

      <Layout style={{ background: '#fff' }}>
        <Header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#fff',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <Dropdown menu={profileMenu} trigger={['click']}>
            <Avatar
              size="large"
              style={{
                cursor: 'pointer',
                background: '#fed400',
                color: '#000',
              }}
            >
              U
            </Avatar>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
