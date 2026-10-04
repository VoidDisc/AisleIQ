import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const data = await api.post('/auth/login', formData, true);
      
      if (data.access_token) {
        api.setToken(data.access_token);
        // fetch user info immediately to set role
        const userInfo = await api.get('/auth/me');
        login(data.access_token, { username: userInfo.username, role: userInfo.role });
        navigate('/');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-text">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary mb-4">
          <Activity size={48} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">
          Sign in to AisleIQ
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-surfaceHighlight">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-textMuted">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-surfaceHighlight rounded-md shadow-sm bg-background placeholder-textMuted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-surfaceHighlight rounded-md shadow-sm bg-background placeholder-textMuted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"
                />
              </div>
            </div>

            {error && (
              <div className="text-danger text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Lock size={18} className="mr-2" />
                Sign in
              </button>
            </div>
            
            <div className="mt-4 text-xs text-textMuted text-center">
              <p>Default Admin: admin / admin</p>
              <p>Default Viewer: viewer / viewer</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
