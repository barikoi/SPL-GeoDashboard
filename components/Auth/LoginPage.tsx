'use client';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { loginStart, loginSuccess, loginFailure } from '@/store/authSlice';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error } = useAuthPersistence();

  // Static credentials
  const VALID_EMAIL = 'spl@gmail.com';
  const VALID_PASSWORD = 'spl@123';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      dispatch(loginFailure('Please enter both email and password'));
      return;
    }

    dispatch(loginStart());

    // Simulate API call delay
    setTimeout(() => {
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        dispatch(loginSuccess());
      } else {
        dispatch(loginFailure('Invalid email or password'));
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card
        className="w-full max-w-md shadow-2xl border-0"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div className="text-center mb-8">
          <Title level={2} className="text-gray-800 dark:text-white mb-2">
            Welcome Back
          </Title>
          <Text className="">
            Sign in to access your dashboard
          </Text>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              size="large"
              placeholder="Enter your email"
              prefix={<UserOutlined className="text-gray-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input.Password
              size="large"
              placeholder="Enter your password"
              prefix={<LockOutlined className="text-gray-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12"
              disabled={isLoading}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-0"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage; 