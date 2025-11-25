import { Button, Space, Typography, List } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const USERS_KEY = 'mockUsers';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function People() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3}>Рекомендации</Typography.Title>

      <List
        bordered
        dataSource={users}
        locale={{ emptyText: 'Пока нет зарегистрированных пользователей' }}
        renderItem={(u) => (
          <List.Item
            actions={[
              <Button key="profile" type="primary" onClick={() => nav(`/profile/${u.id}`)}>
                Открыть профиль
              </Button>,
              <Button key="chat" onClick={() => nav('/chats')}>
                Написать (в чаты)
              </Button>,
            ]}
          >
            {u.username}
          </List.Item>
        )}
      />
    </Space>
  );
}
