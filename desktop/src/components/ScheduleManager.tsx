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
  Tag,
  Row,
  Col,
  message,
  Switch,
  Card,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import axios from 'axios'

interface Schedule {
  id: string
  name: string
  shopId: string
  taskType: string
  cronExpression: string
  enabled: boolean
  lastRun?: string
}

function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [shops, setShops] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [form] = Form.useForm()

  const cronExamples = [
    { label: '每天凌晨2点', value: '0 2 * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天10点', value: '0 10 * * *' },
    { label: '周一至周五每天9点', value: '0 9 * * 1-5' },
    { label: '每周日晚上8点', value: '0 20 * * 0' },
    { label: '每月1号10点', value: '0 10 1 * *' },
  ]

  useEffect(() => {
    fetchSchedules()
    fetchShops()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/schedules', {
        headers: { 'x-user-id': 'current-user-id' }
      })
      setSchedules(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      message.error('获取定时任务失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchShops = async () => {
    try {
      const response = await axios.get('/api/shops', {
        headers: { 'x-user-id': 'current-user-id' }
      })
      setShops(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const handleCreateSchedule = () => {
    form.resetFields()
    setEditingSchedule(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingSchedule) {
        // 编辑
        await axios.put(`/api/schedules/${editingSchedule.id}`, values)
        message.success('定时任务已更新')
      } else {
        // 创建
        await axios.post('/api/schedules', values)
        message.success('定时任务已创建')
      }
      setIsModalOpen(false)
      fetchSchedules()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await axios.delete(`/api/schedules/${scheduleId}`)
      message.success('定时任务已删除')
      fetchSchedules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleSchedule = async (schedule: Schedule) => {
    try {
      await axios.put(`/api/schedules/${schedule.id}`, {
        enabled: !schedule.enabled
      })
      fetchSchedules()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '店铺',
      dataIndex: 'shopId',
      width: 150,
      render: (shopId: string) => {
        const shop = shops.find(s => s.id === shopId)
        return shop?.shop_name || shopId
      },
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          product_sync: '商品同步',
          stats_sync: '数据同步',
          shop_login: '店铺登录',
        }
        return typeMap[type] || type
      },
    },
    {
      title: 'Cron表达式',
      dataIndex: 'cronExpression',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean, record: Schedule) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleSchedule(record)}
        />
      ),
    },
    {
      title: '最后运行',
      dataIndex: 'lastRun',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_, record: Schedule) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingSchedule(record)
              form.setFieldsValue(record)
              setIsModalOpen(true)
            }}
          />
          <Popconfirm
            title="确认删除?"
            onConfirm={() => handleDeleteSchedule(record.id)}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSchedule}>
            创建定时任务
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={schedules}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingSchedule ? '编辑定时任务' : '创建定时任务'}
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
            label="店铺"
            name="shopId"
            rules={[{ required: true, message: '请选择店铺' }]}
          >
            <Select
              placeholder="选择店铺"
              options={shops.map(s => ({
                label: s.shop_name,
                value: s.id
              }))}
            />
          </Form.Item>

          <Form.Item
            label="任务类型"
            name="taskType"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select
              placeholder="选择任务类型"
              options={[
                { label: '商品同步', value: 'product_sync' },
                { label: '数据同步', value: 'stats_sync' },
                { label: '店铺登录', value: 'shop_login' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="任务名称"
            name="name"
          >
            <Input placeholder="例如：每天早上2点同步商品" />
          </Form.Item>

          <Form.Item
            label="Cron表达式"
            name="cronExpression"
            rules={[{ required: true, message: '请输入Cron表达式' }]}
            extra="格式: 分 时 日 月 周(0-6表示周日-周六)"
          >
            <Input placeholder="例如: 0 2 * * * (每天凌晨2点)" />
          </Form.Item>

          <Card size="small" title="常用表达式" style={{ marginBottom: 16 }}>
            <Space wrap>
              {cronExamples.map(item => (
                <Button
                  type="dashed"
                  size="small"
                  key={item.value}
                  onClick={() => form.setFieldValue('cronExpression', item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Form>
      </Modal>
    </div>
  )
}

export default ScheduleManager
