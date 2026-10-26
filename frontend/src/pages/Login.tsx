import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/AuthShell';
import { Button, Field, Input } from '@/components/ui';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(formData);
      login();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Could not log in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="See where your money went this month."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-accent-ink hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
