import { Typography } from 'antd';
import { useParams } from 'react-router-dom';

export default function UserProfile() {
  const { id } = useParams();
  return <Typography.Title level={3}>Профиль пользователя {id}</Typography.Title>;
}
