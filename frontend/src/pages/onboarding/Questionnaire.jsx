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

const { Title, Text } = Typography;

// Helper functions for image upload
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

export default function Questionnaire() {
  const nav = useNavigate();
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data from backend
  const [cities, setCities] = useState([]);
  const [allInterests, setAllInterests] = useState([]);

  // Form state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Group interests fetched from backend
  const groupedInterests = useMemo(() => {
    const map = new Map(); // group -> items
    for (const it of allInterests) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group).push(it);
    }
    const order = ['Спорт', 'Настольные игры', 'IT-клубы', 'Музыка', 'Путешествия', 'Другое'];
    return order
      .filter((g) => map.has(g))
      .map((g) => ({ group: g, items: map.get(g) }));
  }, [allInterests]);

  const toggleInterest = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Load initial data from backend
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [interestsRes, citiesRes, meRes, myInterestsRes] = await Promise.all([
          http.get(Endpoints.SURVEY.INTERESTS),
          http.get('/cities'),
          http.get(Endpoints.USERS.ME),
          http.get(Endpoints.SURVEY.MY_INTERESTS),
        ]);

        if (!alive) return;

        setAllInterests(Array.isArray(interestsRes.data) ? interestsRes.data : []);
        setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);

        // Set profile data
        const profile = meRes.data?.profile ?? {};
        form.setFieldsValue({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || '',
          telegram: profile.telegram || '',
          city: profile.city || undefined,
          about: profile.about || '',
        });
        setAvatarUrl(profile.avatar_url || '');

        // Set user's interests
        const interestIds = Array.isArray(myInterestsRes.data)
          ? myInterestsRes.data.map((i) => i.id)
          : [];
        setSelectedIds(new Set(interestIds));

      } catch (e) {
        message.error('Не удалось загрузить данные для анкеты');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [form, message]);

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
      // Fallback to data URL if ImgBB fails or is not configured
      const dataUrl = await fileToBase64(file);
      setAvatarUrl(dataUrl);
      message.success('Фото добавлено (data URL)');
      return false;
    } catch {
      message.error('Не удалось загрузить фото');
      return Upload.LIST_IGNORE;
    }
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const ids = Array.from(selectedIds);
      if (!ids.length) {
        message.warning('Выберите хотя бы один интерес');
        return;
      }

      setSaving(true);

      // Save profile and interests in parallel
      await Promise.all([
        http.patch(Endpoints.USERS.ME, {
          first_name: values.firstName?.trim(),
          last_name: values.lastName?.trim() || null,
          email: values.email?.trim() || null,
          telegram: values.telegram?.trim() || null,
          city: values.city,
          about: values.about?.trim() || null,
          avatar_url: avatarUrl || null,
        }),
        http.put(Endpoints.SURVEY.MY_INTERESTS, Array.from(selectedIds)),
      ]);

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
    <div>
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
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[24, 16]} align="middle">
              <Col>
                <Avatar size={72} src={avatarUrl || undefined} style={{ background: '#f0f0f0', color: '#000' }}>
                  {!avatarUrl ? 'Фото' : null}
                </Avatar>
              </Col>
              <Col>
                <Upload accept="image/*" showUploadList={false} beforeUpload={onPickPhoto}>
                  <Button type="primary" icon={<UploadOutlined />}>Добавить фото</Button>
                </Upload>
              </Col>
            </Row>

            <div style={{ height: 16 }} />

            <Form form={form} layout="vertical" requiredMark={false}>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item label="Имя" name="firstName" rules={[{ required: true, message: 'Введите имя' }]}>
                    <Input placeholder="Елена" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Фамилия" name="lastName">
                    <Input placeholder="Иванова" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Email" name="email">
                    <Input placeholder="elena@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Телеграм" name="telegram">
                    <Input placeholder="@elena_ivanova" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Ваш город" name="city" rules={[{ required: true, message: 'Выберите город' }]}>
                    <Select
                      showSearch
                      placeholder="Начните вводить город..."
                      options={cities.map((c) => ({ value: c, label: c }))}
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
              <Title level={4} style={{ marginBottom: 12 }}>Выберите ваши интересы</Title>
              <Row gutter={[16, 16]}>
                {groupedInterests.map((g) => (
                  <Col key={g.group} xs={24} md={12} lg={8}>
                    <Card size="small" variant="borderless" style={{ borderRadius: 16 }} title={<b>{g.group}</b>}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {g.items.map((it) => {
                          const active = selectedIds.has(it.id);
                          return (
                            <Tag.CheckableTag
                              style={{ borderRadius: 16 }}
                              key={it.id}
                              checked={active}
                              onChange={() => toggleInterest(it.id)}
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
                <Button type="primary" size="large" style={{ minWidth: 220, borderRadius: 20 }} loading={saving} onClick={save}>
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
