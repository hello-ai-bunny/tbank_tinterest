import { useState, useEffect, useMemo } from 'react';
import { App as AntApp, Typography, Space, Tabs, Card, Row, Col, Avatar, Form, Input, Select, Tag, Button, Upload, message, } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

export default function Settings() {
  const { message } = AntApp.useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [form] = Form.useForm();
  const [photoBase64, setPhotoBase64] = useState('');
  const [selectedInterests, setSelectedInterests] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const users = getUsers();
    const userData = users.find((x) => x.id === authUser.id);
    const profile = (userData && userData.profile) || {};

    form.setFieldsValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      telegram: profile.telegram || '',
      city: profile.city || undefined,
      about: profile.about || '',
    });

    setPhotoBase64(profile.photoBase64 || '');
    setSelectedInterests(profile.interestsByGroup || {});
  }, [authUser, form]);

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
      message.success('Фото обновлено');
      return false;
    } catch {
      message.error('Не удалось прочитать файл');
      return Upload.LIST_IGNORE;
    }
  };

  const toggleInterest = (group, item) => {
    setSelectedInterests((prev) => {
      const current = new Set(prev[group] || []);
      if (current.has(item)) {
        current.delete(item);
      } else {
        current.add(item);
      }

      return {
        ...prev,
        [group]: Array.from(current),
      };
    });
  };

  const interestsFlat = useMemo(() => {
    const all = [];
    Object.values(selectedInterests).forEach((arr) => (arr || []).forEach((x) => all.push(x)));
    return all;
  }, [selectedInterests]);

  const saveProfile = async () => {
    try {
      const values = await form.validateFields();

      if (!authUser) {
        message.error('Нет авторизации');
        return;
      }

      const updatedProfile = {
        ...values,
        photoBase64,
        interestsByGroup: selectedInterests,
        interests: interestsFlat,
      };

      const users = getUsers();
      const userIndex = users.findIndex((x) => x.id === authUser.id);

      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], profile: updatedProfile };
      } else {
        users.push({ ...authUser, profile: updatedProfile });
      }

      setUsers(users);

      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...authUser, profile: updatedProfile }));

      setIsEditing(false);
      message.success('Настройки сохранены');
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  };

  const cancelEditing = () => {
    if (!authUser) return;

    const users = getUsers();
    const userData = users.find((x) => x.id === authUser.id);
    const profile = (userData && userData.profile) || {};

    form.setFieldsValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      telegram: profile.telegram || '',
      city: profile.city || undefined,
      about: profile.about || '',
    });

    setPhotoBase64(profile.photoBase64 || '');
    setSelectedInterests(profile.interestsByGroup || {});
    setIsEditing(false);
  };

  const tabItems = [
    {
      key: 'profile',
      label: 'Профиль',
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Личная информация</Title>
            {!isEditing && (
              <Button type="primary" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            )}
          </div>

          <Card variant="borderless" style={{ padding: 0 }}>
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

              {isEditing && (
                <Col>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={onPickPhoto}
                  >
                    <Button type="primary" >
                      Изменить фото
                    </Button>
                  </Upload>
                </Col>
              )}
            </Row>

            <div style={{ height: 24 }} />

            {isEditing ? (
              <>
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
                        <TextArea
                          rows={4}
                          placeholder="Пара слов о себе…"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                  <Button onClick={cancelEditing}>
                    Отмена
                  </Button>
                  <Button type="primary" onClick={saveProfile}>
                    Сохранить изменения
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <Row gutter={[24, 16]}>
                  <Col span={12}>
                    <Text strong>Имя:</Text>
                    <div>{form.getFieldValue('firstName') || 'Не указано'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Фамилия:</Text>
                    <div>{form.getFieldValue('lastName') || 'Не указано'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Email:</Text>
                    <div>{form.getFieldValue('email') || 'Не указано'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Телеграм:</Text>
                    <div>{form.getFieldValue('telegram') || 'Не указано'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Город:</Text>
                    <div>{form.getFieldValue('city') || 'Не указано'}</div>
                  </Col>
                  <Col span={24}>
                    <Text strong>Обо мне:</Text>
                    <div style={{
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 4
                    }}>
                      {form.getFieldValue('about') || 'Не указано'}
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Space>
      ),
    },
    {
      key: 'interests',
      label: 'Интересы',
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Ваши интересы</Title>
            {!isEditing && (
              <Button type="primary" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            )}
          </div>

          <Card variant="borderless" style={{ padding: 0 }}>
            {isEditing ? (
              <>
                <Row gutter={[16, 16]}>
                  {INTERESTS.map((group) => (
                    <Col key={group.group} xs={24} md={12} lg={8}>
                      <Card
                        size="small"
                        variant="outlined"
                        style={{ borderRadius: 16 }}
                        title={<span style={{ fontWeight: 700 }}>{group.group}</span>}
                      >
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {group.items.map((item) => {
                            const active = (selectedInterests[group.group] || []).includes(item);
                            return (
                              <Tag.CheckableTag
                                key={item}
                                checked={active}
                                onChange={() => toggleInterest(group.group, item)}
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

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                  <Button onClick={cancelEditing}>
                    Отмена
                  </Button>
                  <Button type="primary" onClick={saveProfile}>
                    Сохранить интересы
                  </Button>
                </div>
              </>
            ) : (
              <div>
                {INTERESTS.map((group) => {
                  const groupInterests = selectedInterests[group.group] || [];
                  if (groupInterests.length === 0) return null;

                  return (
                    <div key={group.group} style={{ marginBottom: 16 }}>
                      <Text strong>{group.group}:</Text>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        {groupInterests.map((interest) => (
                          <Tag
                            key={interest}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: '#f0f0f0',
                              color: '#000',
                              border: '1px solid #e0e0e0',
                            }}
                          >
                            {interest}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {interestsFlat.length === 0 && (
                  <Text type="secondary">Интересы не выбраны</Text>
                )}
              </div>
            )}
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>Настройки аккаунта</Title>
      <Text>
        Управляйте информацией о своем профиле, интересах, конфиденциальности и уведомлениями.
      </Text>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabBarStyle={{ marginBottom: 24 }}
      />
    </Space>
  );
}