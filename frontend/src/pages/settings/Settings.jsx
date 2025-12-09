import { useEffect, useMemo, useState } from 'react';
import { App as AntApp, Avatar, Button, Card, Col, Form, Input, Row, Select, Space, Spin, Tabs, Tag, Typography, Upload, } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

// TO DO: дописать поля email и телеграма

const { Title, Text } = Typography;

const CITIES = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск',
  'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Пермь', 'Воронеж', 'Волгоград', 'Краснодар',
  'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
];

const GROUP_BY_NAME = {
  'Спорт': 'Спорт',
  'Йога': 'Спорт',
  'Футбол': 'Спорт',
  'Баскетбол': 'Спорт',
  'Плавание': 'Спорт',
  'Велоспорт': 'Спорт',

  'Настольные игры': 'Настольные игры',
  'Монополия': 'Настольные игры',
  'Эрудит': 'Настольные игры',
  'Покер': 'Настольные игры',
  'Квизы': 'Настольные игры',

  'Программирование': 'IT-клубы',
  'Киберспорт': 'IT-клубы',
  'ИИ/Машинное обучение': 'IT-клубы',
  'Наука': 'IT-клубы',

  'Музыка': 'Музыка',
  'Рок': 'Музыка',
  'Поп': 'Музыка',
  'Классика': 'Музыка',
  'Электронная': 'Музыка',

  'Кино': 'Другое',
  'Книги': 'Другое',
  'Фотография': 'Другое',
  'Кулинария': 'Другое',
  'Искусство': 'Другое',
  'Театр': 'Другое',
  'Видеоигры': 'Другое',
  'Психология': 'Другое',

  'Путешествия': 'Путешествия',
  'Пеший туризм': 'Путешествия',
  'Пляжный отдых': 'Путешествия',
  'Экскурсии': 'Путешествия',
  'Гастрономический туризм': 'Путешествия',
};

function splitFullName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function joinFullName(firstName = '', lastName = '') {
  return `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function uploadToImgBB(file) {
  const key = import.meta.env.VITE_IMGBB_KEY;
  if (!key) return null;

  const dataUrl = await fileToBase64(file);
  const base64 = dataUrl.split(',')[1] || '';

  const form = new FormData();
  form.append('image', base64);

  const { data } = await axios.post(`https://api.imgbb.com/1/upload?key=${key}`, form);
  return data?.data?.url || null;
}

async function setMyInterests(ids) {
  const payloads = [ids, { interest_ids: ids }, { ids }, { interests: ids }];

  let lastErr = null;
  for (const payload of payloads) {
    try {
      await http.put(Endpoints.SURVEY.MY_INTERESTS, payload);
      return;
    } catch (e) {
      lastErr = e;
      const status = e?.response?.status;
      if (status && status >= 500) break;
    }
  }
  throw lastErr;
}

export default function Settings() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();

  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [allInterests, setAllInterests] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of allInterests) {
      const name = String(it?.name || '').trim();
      const group = GROUP_BY_NAME[name] || 'Другое';
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(it);
    }

    const order = ['Спорт', 'Настольные игры', 'IT-клубы', 'Музыка', 'Путешествия', 'Другое'];
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g) }));
  }, [allInterests]);

  const toggleInterest = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const [meRes, interestsRes, myRes] = await Promise.all([
          http.get(Endpoints.USERS.ME),
          http.get(Endpoints.SURVEY.INTERESTS),
          http.get(Endpoints.SURVEY.MY_INTERESTS),
        ]);

        if (!alive) return;

        const profile = meRes?.data?.profile ?? {};
        const { firstName, lastName } = splitFullName(profile?.full_name);

        form.setFieldsValue({
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          email: profile?.email || '',
          telegram: profile?.telegram || '',
          city: profile?.city || undefined,
          about: profile?.about || '',
        });

        setAvatarUrl(profile?.avatar_url || '');

        const all = Array.isArray(interestsRes?.data) ? interestsRes.data : [];
        setAllInterests(all);

        const mine = Array.isArray(myRes?.data) ? myRes.data : [];
        setSelectedIds(new Set(mine.map((x) => x?.id).filter(Boolean)));
      } catch (e) {
        message.error('Не удалось загрузить настройки');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [form, message]);

  const onPickPhoto = async (file) => {
    try {
      const okType = file.type?.startsWith('image/');
      if (!okType) return Upload.LIST_IGNORE;

      const hostedUrl = await uploadToImgBB(file);
      if (hostedUrl) {
        setAvatarUrl(hostedUrl);
        message.success('Фото загружено');
        return false;
      }

      const dataUrl = await fileToBase64(file);
      setAvatarUrl(dataUrl);
      message.success('Фото добавлено');
      return false;
    } catch {
      message.error('Не удалось загрузить фото');
      return Upload.LIST_IGNORE;
    }
  };

  const saveProfile = async () => {
    try {
      const values = await form.validateFields();
      const fullName = joinFullName(values.firstName, values.lastName);

      if (fullName.trim().length < 2) {
        message.warning('Имя должно быть минимум 2 символа');
        return;
      }

      setSavingProfile(true);

      await http.patch(Endpoints.USERS.ME, {
        first_name: values.firstName?.trim(),
        last_name: values.lastName?.trim() || null,
        email: values.email?.trim() || null,
        telegram: values.telegram?.trim() || null,
        city: values.city,
        about: values.about?.trim() || null,
        avatar_url: avatarUrl || null,
      });

      message.success('Профиль сохранён');
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Ошибка сохранения профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveInterests = async () => {
    try {
      const ids = Array.from(selectedIds);
      if (!ids.length) {
        message.warning('Выберите хотя бы один интерес');
        return;
      }

      setSavingInterests(true);
      await setMyInterests(ids);

      message.success('Интересы сохранены');
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Ошибка сохранения интересов');
    } finally {
      setSavingInterests(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Spin />
      </div>
    );
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Title level={3} style={{ margin: 0 }}>Настройки</Title>
      <Text type="secondary">Здесь можно изменить профиль и интересы.</Text>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'profile',
            label: 'Профиль',
            children: (
              <Card bordered={false} style={{ borderRadius: 16 }}>
                <Row gutter={[24, 16]} align="middle">
                  <Col>
                    <Avatar
                      size={72}
                      src={avatarUrl || undefined}
                      style={{ background: '#f0f0f0', color: '#000' }}
                    >
                      Фото
                    </Avatar>
                  </Col>

                  <Col>
                    <Upload accept="image/*" showUploadList={false} beforeUpload={onPickPhoto}>
                      <Button type="primary" icon={<UploadOutlined />}>
                        Изменить фото
                      </Button>
                    </Upload>

                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {import.meta.env.VITE_IMGBB_KEY}
                      </Text>
                    </div>
                  </Col>
                </Row>

                <div style={{ height: 16 }} />

                <Form form={form} layout="vertical" requiredMark={false}>
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
                      <Form.Item label="Фамилия" name="lastName">
                        <Input placeholder="Иванова" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ type: 'email', message: 'Введите корректный email' }]}
                      >
                        <Input placeholder="elena@example.com" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="Телеграм" name="telegram">
                        <Input placeholder="@elena_ivanova" />
                      </Form.Item>
                    </Col>


                    <Col xs={24}>
                      <Form.Item
                        label="Ваш город"
                        name="city"
                        rules={[{ required: true, message: 'Выберите город' }]}
                      >
                        <Select
                          showSearch
                          placeholder="Начните вводить город..."
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={CITIES.map((c) => ({ value: c, label: c }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item label="Обо мне" name="about">
                        <Input.TextArea rows={4} placeholder="Пара слов о себе…" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="primary" loading={savingProfile} onClick={saveProfile}>
                    Сохранить профиль
                  </Button>
                </div>
              </Card>
            ),
          },
          {
            key: 'interests',
            label: 'Интересы',
            children: (
              <Card variant="borderless" style={{ borderRadius: 16 }}>
                <Title level={4} style={{ marginTop: 0 }}>Выберите интересы</Title>

                <Row gutter={[16, 16]}>
                  {grouped.map((g) => (
                    <Col key={g.group} xs={24} md={12} lg={8}>
                      <Card size="small" variant="borderless" style={{ borderRadius: 16 }}>
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>{g.group}</div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {g.items.map((it) => {
                            const active = selectedIds.has(it.id);
                            return (
                              <Tag.CheckableTag
                                key={it.id}
                                checked={active}
                                onChange={() => toggleInterest(it.id)}
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
                                {it.name}
                              </Tag.CheckableTag>
                            );
                          })}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <div style={{ height: 16 }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="primary" loading={savingInterests} onClick={saveInterests}>
                    Сохранить интересы
                  </Button>
                </div>
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}
