import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Spin, message, Button, Space } from 'antd'
import { ScanOutlined, LoginOutlined } from '@ant-design/icons'

interface LoginDialogProps {
  visible: boolean
  shopId: string
  onLoginSuccess: (shopInfo: any) => void
  onCancel: () => void
}

function LoginDialog({ visible, shopId, onLoginSuccess, onCancel }: LoginDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'qrcode' | 'password'>('qrcode')
  const [taskId, setTaskId] = useState<string>('')
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timer | null>(null)

  // 启动登录任务
  const startLogin = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/integration/tasks/shop-login/${shopId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id' // TODO: 从真实用户session获取
        }
      })

      const data = await response.json()

      if (response.ok) {
        setTaskId(data.data.id)
        message.info('登录窗口已打开，请完成登录')

        // 开始轮询任务状态
        pollTaskStatus(data.data.id)
      } else {
        message.error(data.error || '启动登录失败')
        setLoading(false)
      }
    } catch (error) {
      message.error('启动登录出错')
      setLoading(false)
    }
  }

  // 轮询任务状态
  const pollTaskStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tasks/${id}`)
        const data = await response.json()
        const task = data.data

        if (task.status === 'completed') {
          clearInterval(interval)
          const shopInfo = JSON.parse(task.result)
          message.success('登录成功！')
          onLoginSuccess(shopInfo)
          setLoading(false)
        } else if (task.status === 'failed') {
          clearInterval(interval)
          message.error(`登录失败: ${task.error_message}`)
          setLoading(false)
        }
      } catch (error) {
        console.error('Poll error:', error)
      }
    }, 2000) // 每2秒检查一次

    setPollingInterval(interval)
  }

  // 取消登录
  const handleCancel = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setLoading(false)
    setTaskId('')
    onCancel()
  }

  const tabItems = [
    {
      key: 'qrcode',
      label: (
        <span>
          <ScanOutlined /> 扫码登录
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin spinning={loading}>
            <div style={{ marginBottom: 20 }}>
              <p>请在打开的浏览器中使用拼多多商家版App扫描二维码登录</p>
              <div
                style={{
                  width: 200,
                  height: 200,
                  margin: '0 auto',
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {loading ? '生成二维码中...' : '二维码会在浏览器中显示'}
              </div>
            </div>
          </Spin>
        </div>
      )
    },
    {
      key: 'password',
      label: (
        <span>
          <LoginOutlined /> 账号密码
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin spinning={loading}>
            <p>请在打开的浏览器窗口中输入账号密码登录</p>
          </Spin>
        </div>
      )
    }
  ]

  return (
    <Modal
      title="店铺登录"
      open={visible}
      onCancel={handleCancel}
      width={500}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="login"
          type="primary"
          loading={loading}
          onClick={startLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '开始登录'}
        </Button>
      ]}
    >
      <Tabs defaultValue="qrcode" items={tabItems} />
    </Modal>
  )
}

export default LoginDialog
