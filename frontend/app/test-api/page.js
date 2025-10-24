'use client';

import { useState, useEffect } from 'react';
import { API } from '../../config/api';

export default function TestAPIPage() {
  const [apiInfo, setApiInfo] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get API configuration info
    setApiInfo({
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      isProduction: API.isProductionEnvironment(),
      apiUrl: API.API_URL,
      loginEndpoint: API.auth.login(),
      uploadUrl: API.uploads.getUploadURL('test.jpg'),
      vercelEnv: process.env.VERCEL,
      vercelUrl: process.env.VERCEL_URL,
      vercelEnvVar: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      backendPath: process.env.NEXT_PUBLIC_BACKEND_PATH,
      isVercelProduction: process.env.NODE_ENV === 'production' && 
        (process.env.VERCEL === '1' || process.env.VERCEL_URL || process.env.VERCEL_ENV)
    });
  }, []);

  const testLogin = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch(API.auth.login(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      });
      
      const data = await response.json();
      setTestResult({
        success: true,
        status: response.status,
        data: data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Configuration Test</h1>
        
        {/* API Configuration Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          <div className="space-y-2">
            <p><strong>Hostname:</strong> {apiInfo?.hostname}</p>
            <p><strong>Is Production:</strong> {apiInfo?.isProduction ? 'Yes' : 'No'}</p>
            <p><strong>Is Vercel Production:</strong> {apiInfo?.isVercelProduction ? 'Yes' : 'No'}</p>
            <p><strong>Vercel Env:</strong> {apiInfo?.vercelEnv || 'Not set'}</p>
            <p><strong>Vercel URL:</strong> {apiInfo?.vercelUrl || 'Not set'}</p>
            <p><strong>Vercel Env Var:</strong> {apiInfo?.vercelEnvVar || 'Not set'}</p>
            <p><strong>Node Env:</strong> {apiInfo?.nodeEnv}</p>
            <p><strong>API Base URL:</strong> {apiInfo?.apiBaseUrl || 'Not set'}</p>
            <p><strong>Backend Path:</strong> {apiInfo?.backendPath || 'Not set'}</p>
            <p><strong>API URL:</strong> {apiInfo?.apiUrl}</p>
            <p><strong>Login Endpoint:</strong> {apiInfo?.loginEndpoint}</p>
            <p><strong>Upload URL:</strong> {apiInfo?.uploadUrl}</p>
          </div>
        </div>

        {/* Test Login Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Login Endpoint</h2>
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {loading ? 'Testing...' : 'Test Login API'}
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
