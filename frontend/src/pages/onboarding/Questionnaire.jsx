import { Card, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function Questionnaire() {
  const nav = useNavigate();
  const save = () => {
    localStorage.setItem('onboardingDone', '1');
    nav('/');
  };

  return (
    <Card>
      <Typography.Title level={3}>Анкета</Typography.Title>
      <Button type="primary" onClick={save}>Сохранить</Button>
    </Card>
  );
}
