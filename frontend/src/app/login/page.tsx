// src/app/login/page.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Image from 'next/image'
import api from '@/lib/api';
import ParticlesBackground from '../components/ParticlesBackground';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/token/', {
        username,
        password,
      });

      const { access } = response.data;

      if (access) {
        Cookies.set('auth_token', access, { expires: 7 });
        router.push('/home');
      } else {
        throw new Error('Token não recebido do servidor.');
      }

    } catch (err) {
      setError('Usuário ou senha inválidos.');
      console.error("Erro no login:", err);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center font-sans">
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-blue-800 bg-black bg-opacity-80 p-8 shadow-2xl backdrop-blur-sm">

        {/* --- TESTE COM UMA TAG DE IMAGEM SIMPLES --- */}

{/* Bloco do Logo Final e Otimizado ✅ */}
          <div className="flex justify-center mb-8">
          <Image
            src="/Logofinance.png" 
            alt="Finance Logo"
            width={200}  // Reduzimos a largura
            height={200}   // Reduzimos a altura para manter a proporção
            priority
          />
            </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-400">
              Usuário
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white placeholder-slate-500 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-400">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white placeholder-slate-500 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              placeholder="Digite sua senha"
              required
            />
          </div>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}