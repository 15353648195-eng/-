import { Layout, Menu, Tabs } from 'antd'
import { ShopOutlined, BarChartOutlined, TaskOutlined } from '@ant-design/icons'
import ShopList from './components/ShopList'
import './App.css'

const { Header, Content, Sider } = Layout

function App() {
  const [activeKey, setActiveKey] = React.useState('shops')

  const menuItems = [
    { key: 'shops', icon: <ShopOutlined />, label: '店铺管理' },
    { key: 'products', icon: <BarChartOutlined />, label: '商品管理' },
    { key: 'tasks', icon: <TaskOutlined />, label: '任务管理' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <h1 style={{ color: 'white', margin: 0 }}>PDD运营工具</h1>
      </Header>
      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={menuItems}
            onClick={(e) => setActiveKey(e.key)}
          />
        </Sider>
        <Content style={{ padding: '24px' }}>
          {activeKey === 'shops' && <ShopList />}
          {activeKey === 'products' && <div>商品管理 - 开发中</div>}
          {activeKey === 'tasks' && <div>任务管理 - 开发中</div>}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
