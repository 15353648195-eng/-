import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Tag,
  Tooltip,
  Select,
  Spin,
  message,
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import axios from 'axios'

interface Product {
  id: string
  shop_id: string
  product_id: string
  product_name: string
  price: number
  sales_count: number
  image_url?: string
  status: string
  created_at: string
  updated_at: string
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [shops, setShops] = useState<any[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchShops()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      fetchProducts()
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

  const fetchProducts = async () => {
    if (!selectedShop) return

    setLoading(true)
    try {
      const response = await axios.get('/api/shops/' + selectedShop, {
        headers: { 'x-user-id': 'current-user-id' }
      })
      // TODO: 实现获取商品的API端点
      setProducts([])
    } catch (error) {
      console.error('Failed to fetch products:', error)
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
      const response = await axios.post(
        `/api/integration/tasks/product-sync/${selectedShop}`,
        {},
        {
          headers: { 'x-user-id': 'current-user-id' }
        }
      )
      message.success('已开始同步商品数据，请稍候...')
      // 2秒后重新获取
      setTimeout(() => {
        fetchProducts()
        setSyncing(false)
      }, 2000)
    } catch (error) {
      message.error('同步失败')
      setSyncing(false)
    }
  }

  const handleExport = () => {
    if (products.length === 0) {
      message.warning('没有数据可导出')
      return
    }

    const csv = [
      ['商品ID', '商品名称', '价格', '销量'],
      ...products.map(p => [
        p.product_id,
        p.product_name,
        p.price,
        p.sales_count
      ])
    ]
    .map(row => row.join(','))
    .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `products_${selectedShop}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
    p.product_id.includes(searchText)
  )

  const columns = [
    {
      title: '商品ID',
      dataIndex: 'product_id',
      width: 120,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      width: 250,
      render: (text: string, record: Product) => (
        <Tooltip title={text}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {record.image_url && (
              <img
                src={record.image_url}
                alt="product"
                style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
              />
            )}
            <span>{text.length > 30 ? text.substring(0, 30) + '...' : text}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (price: number) => `¥${price.toFixed(2)}`,
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: '销量',
      dataIndex: 'sales_count',
      width: 100,
      sorter: (a: Product, b: Product) => a.sales_count - b.sales_count,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
          <Input
            placeholder="搜索商品名称或ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
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
              同步数据
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={products.length === 0}
            >
              导出
            </Button>
          </Space>
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 50 }}
          locale={{ emptyText: selectedShop ? '暂无商品数据' : '请先选择店铺' }}
        />
      </Spin>
    </div>
  )
}

export default ProductList
