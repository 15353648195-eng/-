import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Select,
  Button,
  Table,
  Space,
  Spin,
  message,
  DatePicker,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  DollarOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import axios from 'axios'

interface StatRecord {
  id: string
  shop_id: string
  date: string
  daily_sales: number
  daily_orders: number
  conversion_rate: number
  page_views: number
}

function Statistics() {
  const [shops, setShops] = useState<any[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [stats, setStats] = useState<StatRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ])

  useEffect(() => {
    fetchShops()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      fetchStats()
    }
  }, [selectedShop])

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

  const fetchStats = async () => {
    if (!selectedShop) return

    setLoading(true)
    try {
      // TODO: 实现获取统计数据的API端点
      // const response = await axios.get(`/api/statistics?shopId=${selectedShop}`)
      setStats([])
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!selectedShop) {
      message.warning('请先选择店铺')
      return
    }

    setSyncing(true)
    try {
      await axios.post(
        `/api/integration/tasks/stats-sync/${selectedShop}`,
        {},
        {
          headers: { 'x-user-id': 'current-user-id' }
        }
      )
      message.success('已开始同步统计数据，请稍候...')
      setTimeout(() => {
        fetchStats()
        setSyncing(false)
      }, 2000)
    } catch (error) {
      message.error('同步失败')
      setSyncing(false)
    }
  }

  const handleExport = () => {
    if (stats.length === 0) {
      message.warning('没有数据可导出')
      return
    }

    const csv = [
      ['日期', '销售额', '订单数', '转化率', '浏览量'],
      ...stats.map(s => [
        s.date,
        s.daily_sales,
        s.daily_orders,
        s.conversion_rate + '%',
        s.page_views
      ])
    ]
    .map(row => row.join(','))
    .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `statistics_${selectedShop}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalSales = stats.reduce((sum, s) => sum + s.daily_sales, 0)
  const totalOrders = stats.reduce((sum, s) => sum + s.daily_orders, 0)
  const avgConversion = stats.length > 0
    ? (stats.reduce((sum, s) => sum + s.conversion_rate, 0) / stats.length).toFixed(2)
    : 0
  const totalPageViews = stats.reduce((sum, s) => sum + s.page_views, 0)

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      sorter: (a: StatRecord, b: StatRecord) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: '销售额 (¥)',
      dataIndex: 'daily_sales',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a: StatRecord, b: StatRecord) => a.daily_sales - b.daily_sales,
    },
    {
      title: '订单数',
      dataIndex: 'daily_orders',
      width: 100,
      sorter: (a: StatRecord, b: StatRecord) => a.daily_orders - b.daily_orders,
    },
    {
      title: '转化率 (%)',
      dataIndex: 'conversion_rate',
      width: 120,
      render: (value: number) => value.toFixed(2) + '%',
      sorter: (a: StatRecord, b: StatRecord) => a.conversion_rate - b.conversion_rate,
    },
    {
      title: '浏览量',
      dataIndex: 'page_views',
      width: 100,
      sorter: (a: StatRecord, b: StatRecord) => a.page_views - b.page_views,
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Select
            style={{ width: '100%' }}
            placeholder="选择店铺"
            value={selectedShop}
            onChange={setSelectedShop}
            options={shops.map(s => ({
              label: s.shop_name,
              value: s.id
            }))}
          />
        </Col>
        <Col xs={24} sm={10}>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Col>
        <Col xs={24} sm={6}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={syncing}
              onClick={handleSync}
              disabled={!selectedShop}
            >
              同步
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={stats.length === 0}
            >
              导出
            </Button>
          </Space>
        </Col>
      </Row>

      {selectedShop && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总销售额"
                  value={totalSales}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总订单数"
                  value={totalOrders}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="平均转化率"
                  value={avgConversion}
                  suffix="%"
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总浏览量"
                  value={totalPageViews}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="统计数据详情">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={stats}
                rowKey="id"
                pagination={{ pageSize: 30 }}
                locale={{ emptyText: '暂无统计数据' }}
              />
            </Spin>
          </Card>
        </>
      )}
    </div>
  )
}

export default Statistics
