import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Tooltip,
  Tag,
  Row,
  Col,
  Drawer,
  Statistic,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  CopyOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import LoginDialog from './LoginDialog'

interface Shop {
  id: string
  shop_name: string
  platform_shop_id: string
  account_name: string
  phone: string
  owner_name: string
  open_date: string
  subject_info: string
  status: 'online' | 'offline' | 'invalid' | 'checking'
  group_name: string
  remark: string
}

interface Task {
  id: string
  shop_id: string
  task_type: string
  status: string
  result?: string
  error_message?: string
}

const statusMap = {
  online: { color: 'green', text: '在线' },
  offline: { color: 'orange', text: '未登录' },
  invalid: { color: 'red', text: '登录失效' },
  checking: { color: 'blue', text: '检测中' },
}

const taskStatusMap = {
  pending: { color: 'default', text: '等待中' },
  running: { color: 'processing', text: '运行中' },
  completed: { color: 'success', text: '完成' },
  failed: { color: 'error', text: '失败' },
}

function ShopList() {
  const [shops, setShops] = useState<Shop[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [form] = Form.useForm()
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [loginDialogVisible, setLoginDialogVisible] = useState(false)
  const [selectedShopForLogin, setSelectedShopForLogin] = useState<string>('')
  const [taskLoading, setTaskLoading] = useState(false)

  useEffect(() => {
    fetchShops()
    const interval = setInterval(fetchTasks, 2000) // 每2秒更新任务状态
    return () => clearInterval(interval)
  }, [])

  const fetchShops = async () => {
    setLoading(true)
    try {
      // TODO: 替换为实际的API端点
      // const response = await axios.get('/api/shops')
      // setShops(response.data.data)
      setShops([]) // 示例空数据
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks', {
        headers: { 'x-user-id': 'current-user-id' }
      })
      setTasks(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const handleAddShop = () => {
    form.resetFields()
    setEditingShop(null)
    setIsModalOpen(true)
  }

  const handleLoginShop = (shopId: string) => {
    setSelectedShopForLogin(shopId)
    setLoginDialogVisible(true)
  }

  const handleLoginSuccess = async (shopInfo: any) => {
    try {
      const response = await axios.put(
        `/api/shops/${selectedShopForLogin}`,
        {
          shopName: shopInfo.shopName,
          status: 'online'
        },
        {
          headers: { 'x-user-id': 'current-user-id' }
        }
      )
      setLoginDialogVisible(false)
      fetchShops()
      // 触发商品同步
      await triggerProductSync(selectedShopForLogin)
    } catch (error) {
      console.error('Failed to update shop:', error)
    }
  }

  const triggerProductSync = async (shopId: string) => {
    try {
      await axios.post(`/api/integration/tasks/product-sync/${shopId}`, {}, {
        headers: { 'x-user-id': 'current-user-id' }
      })
    } catch (error) {
      console.error('Failed to trigger product sync:', error)
    }
  }

  const handleEditShop = (shop: Shop) => {
    form.setFieldsValue(shop)
    setEditingShop(shop)
    setIsModalOpen(true)
  }

  const handleDeleteShop = async (shopId: string) => {
    try {
      await axios.delete(`/api/shops/${shopId}`)
      setShops(shops.filter(s => s.id !== shopId))
    } catch (error) {
      console.error('Failed to delete shop:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingShop) {
        await axios.put(`/api/shops/${editingShop.id}`, values)
      } else {
        await axios.post('/api/shops', values, {
          headers: { 'x-user-id': 'current-user-id' }
        })
      }
      setIsModalOpen(false)
      form.resetFields()
      fetchShops()
    } catch (error) {
      console.error('Failed to save shop:', error)
    }
  }

  const handleViewDetails = (shop: Shop) => {
    setSelectedShop(shop)
    setDrawerVisible(true)
  }

  const columns = [
    {
      title: '店铺名称',
      dataIndex: 'shop_name',
      width: 180,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text && text.length > 18 ? text.substring(0, 18) + '...' : text}</span>
        </Tooltip>
      ),
    },
    {
      title: '账号名称',
      dataIndex: 'account_name',
      width: 140,
    },
    {
      title: '店铺ID',
      dataIndex: 'platform_shop_id',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '分组',
      dataIndex: 'group_name',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text && text.length > 12 ? text.substring(0, 12) + '...' : text}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_, record: Shop) => {
        const isOffline = record.status === 'offline' || record.status === 'invalid'
        return (
          <Space size="small">
            {isOffline && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleLoginShop(record.id)}
              >
                登录
              </Button>
            )}
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleViewDetails(record)}
              title="查看详情"
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditShop(record)}
            />
            <Popconfirm
              title="确认删除?"
              onConfirm={() => handleDeleteShop(record.id)}
              okText="是"
              cancelText="否"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddShop}>
              添加店铺
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchShops} loading={loading}>
              刷新
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={shops}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingShop ? '编辑店铺' : '添加店铺'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="店铺名称"
            name="shop_name"
            rules={[{ required: true, message: '请输入店铺名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="账号名称"
            name="account_name"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="店铺详情"
        placement="right"
        width={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedShop && (
          <div>
            <Row gutter={[0, 16]}>
              <Col span={24}>
                <strong>店铺名称</strong>
                <p>{selectedShop.shop_name}</p>
              </Col>
              <Col span={24}>
                <strong>平台店铺ID</strong>
                <p>{selectedShop.platform_shop_id}</p>
              </Col>
              <Col span={24}>
                <strong>账号名称</strong>
                <p>{selectedShop.account_name}</p>
              </Col>
              <Col span={24}>
                <strong>状态</strong>
                <p>
                  <Tag color={statusMap[selectedShop.status as keyof typeof statusMap]?.color}>
                    {statusMap[selectedShop.status as keyof typeof statusMap]?.text}
                  </Tag>
                </p>
              </Col>
              <Col span={24}>
                <strong>分组</strong>
                <p>{selectedShop.group_name || '未分组'}</p>
              </Col>
              <Col span={24}>
                <strong>备注</strong>
                <p>{selectedShop.remark || '-'}</p>
              </Col>
            </Row>

            <Button
              type="primary"
              block
              style={{ marginTop: 16 }}
              onClick={() => {
                handleLoginShop(selectedShop.id)
                setDrawerVisible(false)
              }}
            >
              重新登录
            </Button>
          </div>
        )}
      </Drawer>

      <LoginDialog
        visible={loginDialogVisible}
        shopId={selectedShopForLogin}
        onLoginSuccess={handleLoginSuccess}
        onCancel={() => setLoginDialogVisible(false)}
      />
    </div>
  )
}

export default ShopList
