// src/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/login/LoginForm';

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('svdrayf_token');
    const user = localStorage.getItem('svdrayf_user');
    
    // Guardia Perimetral: Si el token y usuario ya existen, saltamos el login de inmediato
    if (token && user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <LoginForm />
      </div>
    </div>
  );
}