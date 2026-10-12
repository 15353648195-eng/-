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
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import axios from 'axios'

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

const statusMap = {
  online: { color: 'green', text: '在线' },
  offline: { color: 'orange', text: '未登录' },
  invalid: { color: 'red', text: '登录失效' },
  checking: { color: 'blue', text: '检测中' },
}

function ShopList() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchShops()
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

  const handleAddShop = () => {
    form.resetFields()
    setEditingShop(null)
    setIsModalOpen(true)
  }

  const handleEditShop = (shop: Shop) => {
    form.setFieldsValue(shop)
    setEditingShop(shop)
    setIsModalOpen(true)
  }

  const handleDeleteShop = async (shopId: string) => {
    try {
      // TODO: 实现删除API调用
      // await axios.delete(`/api/shops/${shopId}`)
      setShops(shops.filter(s => s.id !== shopId))
    } catch (error) {
      console.error('Failed to delete shop:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      // TODO: 实现添加/编辑API调用
      setIsModalOpen(false)
      form.resetFields()
      fetchShops()
    } catch (error) {
      console.error('Failed to save shop:', error)
    }
  }

  const columns = [
    {
      title: '店铺名称',
      dataIndex: 'shop_name',
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text && text.length > 20 ? text.substring(0, 20) + '...' : text}</span>
        </Tooltip>
      ),
    },
    {
      title: '账号名称',
      dataIndex: 'account_name',
      width: 150,
    },
    {
      title: '店铺ID',
      dataIndex: 'platform_shop_id',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status as keyof typeof statusMap]
        return <Tag color={config?.color}>{config?.text}</Tag>
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
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text && text.length > 15 ? text.substring(0, 15) + '...' : text}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_, record: Shop) => (
        <Space>
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
      ),
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
    </div>
  )
}

export default ShopList
