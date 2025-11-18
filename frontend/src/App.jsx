import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FFDC2EFF',
          colorLink: '#FFDC2EFF',
          colorTextBase: '#000000',
          colorBgBase: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: '#FFDC2EFF',
            colorPrimaryHover: '#FFDC2EFF',
            colorPrimaryActive: '#FFDC2EFF',
            borderRadius: 15,
          },
          Layout: {
            headerBg: '#FFFFFF',
            siderBg: '#FFFFFF',
            bodyBg: '#FFFFFF',
          },
          Menu: {
            itemSelectedColor: '#FFDC2EFF',
            itemHoverColor: '#FFDC2EFF',
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
