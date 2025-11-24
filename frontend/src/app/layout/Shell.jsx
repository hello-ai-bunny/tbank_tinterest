import { useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Typography } from 'antd';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function Shell() {
  const { Header, Sider, Content } = Layout;
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const done = localStorage.getItem('onboardingDone') === '1';
    if (!done && loc.pathname !== '/onboarding') {
      nav('/onboarding', { replace: true });
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
          localStorage.removeItem('onboardingDone');
          nav('/onboarding');
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light">
        <div style={{ padding: '12px 16px' }}>
          <Typography.Text strong>Tinterest</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            { key: 'recs', label: <Link to="/">Рекомендации</Link> },
            { key: 'chats', label: <Link to="/chats">Чаты</Link> },
          ]}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#fff',
          }}
        >
          <Dropdown menu={profileMenu} trigger={['click']}>
            <Avatar
              size="large"
              style={{
                cursor: 'pointer',
                background: '#FFDC2EFF',
                color: '#fff',
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
