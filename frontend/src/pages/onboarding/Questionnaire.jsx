import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AUTH_KEY = 'authUser';
const USERS_KEY = 'mockUsers';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}
function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск', 'Челябинск', 'Нью-Йорк'];

const INTERESTS = [
  { group: 'Спорт', items: ['Футбол', 'Баскетбол', 'Йога', 'Велоспорт', 'Плавание'] },
  { group: 'Настольные игры', items: ['Монополия', 'Эрудит', 'Покер', 'Квизы'] },
  { group: 'IT-клубы', items: ['Программирование', 'Киберспорт', 'ИИ/Машинное обучение'] },
  { group: 'Музыка', items: ['Рок', 'Поп', 'Классика', 'Электронная'] },
  { group: 'Путешествия', items: ['Пеший туризм', 'Пляжный отдых', 'Экскурсии', 'Гастрономический туризм'] },
];

export default function Questionnaire() {
  const nav = useNavigate();
  const [form] = Form.useForm();

  const [photoBase64, setPhotoBase64] = useState('');
  const [selected, setSelected] = useState({}); // { "Спорт": ["Йога", ...], ... }

  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;

    // пробуем подтянуть уже сохранённый профиль (из mockUsers)
    const users = getUsers();
    const u = users.find((x) => x.id === authUser.id);

    const profile = (u && u.profile) || {};

    form.setFieldsValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      telegram: profile.telegram || '',
      city: profile.city || undefined,
      about: profile.about || '',
    });

    setPhotoBase64(profile.photoBase64 || '');
    setSelected(profile.interestsByGroup || {});
  }, [authUser, form]);

  const toggleInterest = (group, item) => {
    setSelected((prev) => {
      const cur = new Set(prev[group] || []);
      if (cur.has(item)) cur.delete(item);
      else cur.add(item);

      return {
        ...prev,
        [group]: Array.from(cur),
      };
    });
  };

  const interestsFlat = useMemo(() => {
    const all = [];
    Object.values(selected).forEach((arr) => (arr || []).forEach((x) => all.push(x)));
    return all;
  }, [selected]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onPickPhoto = async (file) => {
    try {
      const okType = file.type?.startsWith('image/');
      if (!okType) {
        message.error('Можно загрузить только изображение');
        return Upload.LIST_IGNORE;
      }

      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      message.success('Фото добавлено');
      return false; // важно: не загружаем никуда, просто в стейт
    } catch {
      message.error('Не удалось прочитать файл');
      return Upload.LIST_IGNORE;
    }
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      if (!authUser) {
        message.error('Нет авторизации');
        nav('/auth', { replace: true });
        return;
      }

      const profile = {
        ...values,
        photoBase64,
        interestsByGroup: selected,
        interests: interestsFlat, // удобная плоская версия
      };

      // обновляем пользователя в mockUsers
      const users = getUsers();
      const idx = users.findIndex((x) => x.id === authUser.id);

      if (idx !== -1) {
        users[idx] = { ...users[idx], profile };
      } else {
        // на всякий: если вдруг authUser есть, а в массиве нет
        users.push({ ...authUser, profile });
      }

      setUsers(users);

      // обновим authUser (чтобы дальше можно было показывать аватарку etc.)
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...authUser, profile }));

      localStorage.setItem('onboardingDone', '1');
      message.success('Анкета сохранена');
      nav('/', { replace: true });
    } catch {
      // validateFields сам подсветит, если что-то не заполнено
    }
  };

  return (
    <div style={{ maxWidth: 1080 }}>
      <Steps
        current={0}
        items={[{ title: 'Анкета' }, { title: 'Рекомендации' }]}
        style={{ marginBottom: 18 }}
      />

      <Title level={3} style={{ marginTop: 0 }}>
        Личная информация
      </Title>

      <Card bordered={false} style={{ padding: 0 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col>
            <Avatar
              size={72}
              src={photoBase64 || undefined}
              style={{ background: '#f0f0f0', color: '#000' }}
            >
              {!photoBase64 ? 'Фото' : null}
            </Avatar>
          </Col>

          <Col>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={onPickPhoto}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                Добавить фото
              </Button>
            </Upload>
            <div style={{ marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                (локально, без бэка сохраняем в браузер...)
              </Text>
            </div>
          </Col>
        </Row>

        <div style={{ height: 16 }} />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Имя"
                name="firstName"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input placeholder="Елена" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Фамилия"
                name="lastName"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input placeholder="Иванова" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="ivanova.elena@tinterest.com" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Телеграм" name="telegram">
                <Input placeholder="@aaaooo" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Ваш город"
                name="city"
                rules={[{ required: true, message: 'Выберите город' }]}
              >
                <Select
                  placeholder="Выберите город"
                  options={CITIES.map((c) => ({ value: c, label: c }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Обо мне" name="about">
                <Input.TextArea
                  rows={4}
                  placeholder="Пара слов о себе…"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8 }}>
          <Title level={4} style={{ marginBottom: 12 }}>
            Выберите ваши интересы
          </Title>

          <Row gutter={[16, 16]}>
            {INTERESTS.map((g) => (
              <Col key={g.group} xs={24} md={12} lg={8}>
                <Card
                  size="small"
                  bordered
                  style={{ borderRadius: 16 }}
                  title={<span style={{ fontWeight: 700 }}>{g.group}</span>}
                >
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {g.items.map((item) => {
                      const active = (selected[g.group] || []).includes(item);
                      return (
                        <Tag.CheckableTag
                          key={item}
                          checked={active}
                          onChange={() => toggleInterest(g.group, item)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid #e5e5e5',
                            background: active ? 'var(--accent)' : '#f5f5f5',
                            color: '#000',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          {item}
                        </Tag.CheckableTag>
                      );
                    })}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ height: 18 }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" size="large" style={{ minWidth: 220 }} onClick={save}>
              Сохранить
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
