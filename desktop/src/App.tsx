import React, { useEffect } from 'react'
import { Layout, Menu } from 'antd'
import { ShopOutlined, BarChartOutlined, TaskOutlined, ClockCircleOutlined } from '@ant-design/icons'
import ShopList from './components/ShopList'
import ProductList from './components/ProductList'
import Statistics from './components/Statistics'
import ScheduleManager from './components/ScheduleManager'
import { useWebSocket } from './hooks/useWebSocket'
import './App.css'

const { Header, Content, Sider } = Layout

function App() {
  const [activeKey, setActiveKey] = React.useState('shops')
  const { connected, error } = useWebSocket('current-user-id')

  useEffect(() => {
    if (error) {
      console.error('WebSocket error:', error)
    }
  }, [error])

  const menuItems = [
    { key: 'shops', icon: <ShopOutlined />, label: '店铺管理' },
    { key: 'products', icon: <BarChartOutlined />, label: '商品管理' },
    { key: 'stats', icon: <TaskOutlined />, label: '数据统计' },
    { key: 'schedules', icon: <ClockCircleOutlined />, label: '定时任务' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'white', margin: 0 }}>PDD运营工具</h1>
          <span style={{ color: 'white', fontSize: 12 }}>
            {connected ? '✓ 已连接' : '✗ 连接中...'}
          </span>
        </div>
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
          {activeKey === 'products' && <ProductList />}
          {activeKey === 'stats' && <Statistics />}
          {activeKey === 'schedules' && <ScheduleManager />}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
