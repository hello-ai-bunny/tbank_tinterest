import { Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function People() {
  const nav = useNavigate();

  return (
    <Space direction="vertical" size="large">
      <Typography.Title level={3}>Рекомендации</Typography.Title>

      <Space>
        <Button type="primary" onClick={() => nav('/profile/1')}>
          Открыть профиль (пример)
        </Button>
        <Button onClick={() => nav('/chats')}>Написать (в чаты)</Button>
      </Space>
    </Space>
  );
}
