import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Button, Card, Col, Form, Input, Row, Space, Steps, Tag,
  App as AntApp, Typography, Upload, Select, Spin,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import http from '../../shared/api/http';
import { Endpoints } from '../../shared/api/endpoints';

// TO DO: дописать поля email и телеграма

const { Title, Text } = Typography;

const CITIES = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
  'Уфа', 'Красноярск', 'Пермь', 'Воронеж', 'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
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
  const payloads = [
    ids,
    { interest_ids: ids },
    { ids },
    { interests: ids },
  ];

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

export default function Questionnaire() {
  const nav = useNavigate();
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const onboardingDone = useMemo(() => localStorage.getItem('onboardingDone') === '1', []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [allInterests, setAllInterests] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const grouped = useMemo(() => {
    const map = new Map(); // group -> items
    for (const it of allInterests) {
      const name = String(it?.name || '').trim();
      const group = GROUP_BY_NAME[name] || 'Другое';
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(it);
    }

    const order = ['Спорт', 'Настольные игры', 'IT-клубы', 'Музыка', 'Путешествия', 'Другое'];
    return order
      .filter((g) => map.has(g))
      .map((g) => ({ group: g, items: map.get(g) }));
  }, [allInterests]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const { data: interests } = await http.get(Endpoints.SURVEY.INTERESTS);
        if (!alive) return;
        setAllInterests(Array.isArray(interests) ? interests : []);

        if (onboardingDone) {
          try {
            const meRes = await http.get(Endpoints.USERS.ME);
            const profile = meRes?.data?.profile || {};
            const { firstName, lastName } = splitFullName(profile?.full_name);

            form.setFieldsValue({
              firstName,
              lastName,
              city: profile?.city || undefined,
              about: profile?.about || '',
            });

            setAvatarUrl(profile?.avatar_url || '');
          } catch {
          }

          try {
            const myRes = await http.get(Endpoints.SURVEY.MY_INTERESTS);
            const mine = Array.isArray(myRes?.data) ? myRes.data : [];
            setSelectedIds(new Set(mine.map((x) => x.id).filter(Boolean)));
          } catch {
          }
        }
      } catch (e) {
        message.error('Не удалось загрузить интересы');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [form, onboardingDone]);

  const onPickPhoto = async (file) => {
    try {
      const okType = file.type?.startsWith('image/');
      if (!okType) return Upload.LIST_IGNORE;

      const hostedUrl = await uploadToImgBB(file);
      if (hostedUrl) {
        setAvatarUrl(hostedUrl);
        message.success('Фото загружено (url сохранён)');
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

  const save = async () => {
    try {
      const values = await form.validateFields();
      const fullName = joinFullName(values.firstName, values.lastName);

      if (fullName.trim().length < 2) {
        message.warning('Имя должно быть минимум 2 символа');
        return;
      }

      const ids = Array.from(selectedIds);
      if (!ids.length) {
        message.warning('Выберите хотя бы один интерес');
        return;
      }

      setSaving(true);

      await http.patch(Endpoints.USERS.ME, {
        full_name: fullName,
        city: values.city,
        about: values.about || null,
        avatar_url: avatarUrl || null,
        visibility: 'all',
      });

      await setMyInterests(ids);

      localStorage.setItem('onboardingDone', '1');
      message.success('Анкета сохранена');
      nav('/', { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Ошибка сохранения анкеты';
      message.error(msg);
    } finally {
      setSaving(false);
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

      <Card variant="outlined" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <>
            <Row gutter={[24, 16]} align="middle">
              <Col>
                <Avatar
                  size={72}
                  src={avatarUrl || undefined}
                  style={{ background: '#f0f0f0', color: '#000' }}
                >
                  {!avatarUrl ? 'Фото' : null}
                </Avatar>
              </Col>

              <Col>
                <Upload accept="image/*" showUploadList={false} beforeUpload={onPickPhoto}>
                  <Button type="primary" icon={<UploadOutlined />}>
                    Добавить фото
                  </Button>
                </Upload>

                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {import.meta.env.VITE_IMGBB_KEY
                      ? 'Фото сохраняется как ссылка (avatar_url)'
                      : 'Фото сохраняется как data URL (avatar_url)'}
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

            <div style={{ marginTop: 8 }}>
              <Title level={4} style={{ marginBottom: 12 }}>
                Выберите ваши интересы
              </Title>

              <Row gutter={[16, 16]}>
                {grouped.map((g) => (
                  <Col key={g.group} xs={24} md={12} lg={8}>
                    <Card size="small" variant="borderless" style={{ borderRadius: 16 }} title={<b>{g.group}</b>}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {g.items.map((it) => {
                          const active = selectedIds.has(it.id);
                          return (
                            <Tag.CheckableTag
                              key={it.id}
                              checked={active}
                              onChange={() => toggle(it.id)}
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

              <div style={{ height: 18 }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  size="large"
                  style={{ minWidth: 220 }}
                  loading={saving}
                  onClick={save}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
