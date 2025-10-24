'use client';

import { useEffect, useState } from 'react';
import { API, uploadsAPI } from '../../config/api';

export default function TestConfig() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const testConfig = {
      API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost',
      BACKEND_PATH: process.env.NEXT_PUBLIC_BACKEND_PATH || '/capstone-project/backend',
      API_URL: API.API_URL,
      isProduction: API.isProductionEnvironment(),
      testPhotoUrl: uploadsAPI.getUploadURL('default_girl_student.png'),
      testPhotoUrl2: uploadsAPI.getUploadURL('/php/Uploads/default_girl_student.png'),
      testPhotoUrl3: uploadsAPI.getUploadURL('php/Uploads/default_girl_student.png'),
    };
    setConfig(testConfig);
  }, []);

  if (!config) {
    return <div>Loading configuration...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuration Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <p><strong>NEXT_PUBLIC_API_BASE_URL:</strong> {config.API_BASE_URL}</p>
          <p><strong>NEXT_PUBLIC_BACKEND_PATH:</strong> {config.BACKEND_PATH}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
          <p><strong>API_URL:</strong> {config.API_URL}</p>
          <p><strong>Is Production:</strong> {config.isProduction ? 'Yes' : 'No'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Photo URL Tests</h2>
          <p><strong>Filename only:</strong> {config.testPhotoUrl}</p>
          <p><strong>With /php/Uploads/ prefix:</strong> {config.testPhotoUrl2}</p>
          <p><strong>With php/Uploads/ prefix:</strong> {config.testPhotoUrl3}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Images</h2>
          <div className="space-y-2">
            <div>
              <p>Default Girl Student:</p>
              <img 
                src={config.testPhotoUrl} 
                alt="Default Girl Student" 
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  console.error('Image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
                onLoad={(e) => console.log('Image loaded successfully:', e.target.src)}
              />
            </div>
            <div>
              <p>Default Boy Student:</p>
              <img 
                src={uploadsAPI.getUploadURL('default_boy_student.png')} 
                alt="Default Boy Student" 
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  console.error('Image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
                onLoad={(e) => console.log('Image loaded successfully:', e.target.src)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
