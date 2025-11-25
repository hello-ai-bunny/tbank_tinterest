import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#fed400ff',
          colorLink: '#000000',
          colorTextBase: '#000000',
          colorBgBase: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: '#FFDC2EFF',
            colorPrimaryHover: '#ffd500ff',
            colorPrimaryActive: '#ffd500ff',
            borderRadius: 15,
          },
          Layout: {
            headerBg: '#FFFFFF',
            siderBg: '#FFFFFF',
            bodyBg: '#FFFFFF',
          },
          Menu: {
            itemSelectedColor: '#000000',
            itemHoverColor: '#000000',
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
