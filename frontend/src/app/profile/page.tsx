// src/app/profile/page.tsx
'use client'

import { isAxiosError } from 'axios';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import api from '@/lib/api';
import { Toaster, toast } from 'react-hot-toast';
import { FiMenu, FiUser } from 'react-icons/fi';
import AnimatedLayout from '../components/AnimatedLayout';
import Sidebar from '../components/Sidebar';

interface UserProfile {
  username: string;
  email?: string;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function ProfilePage() {
  const { data: user, error, isLoading, mutate: mutateUser } = useSWR<UserProfile>('/user/profile/', fetcher);
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email || '');
    }
  }, [user]);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Salvando alterações...');
    try {
      await api.patch('/user/profile/', { username, email });
      toast.dismiss(loadingToast);
      toast.success('Perfil atualizado com sucesso!');
      mutateUser();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Não foi possível atualizar o perfil.');
      console.error("Erro ao atualizar perfil:", err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmação não correspondem!");
      return;
    }
    const loadingToast = toast.loading('Alterando senha...');
    try {
      await api.post('/user/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.dismiss(loadingToast);
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      let errorMessage = 'Ocorreu um erro inesperado.';
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.error || 'Não foi possível alterar a senha.';
      }
      toast.error(errorMessage);
      console.error("Erro ao alterar senha:", err);
    }
  };

  return (
    <AnimatedLayout>
      <div className="flex h-screen overflow-hidden">
        <Toaster position="top-right" toastOptions={{
          style: { background: '#333', color: '#fff' },
        }} />

        {/* 🔹 Overlay quando sidebar estiver aberta */}
        {isSidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          ></div>
        )}

        {/* 🔹 Sidebar Reutilizável */}
        <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />

        {/* 🔹 Conteúdo principal */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Meu Perfil</h2>
              <p className="text-slate-400">Gerencie suas informações pessoais e de segurança.</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-800"
            >
              <FiMenu className="w-6 h-6 text-white" />
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 🔹 Informações do Perfil */}
            <div className="lg:col-span-2 rounded-xl border border-black bg-black p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Informações do Perfil</h3>
              {isLoading && <p className="text-slate-400 animate-pulse">Carregando perfil...</p>}
              {error && <p className="text-red-400">Não foi possível carregar o perfil.</p>}
              {user && (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                      <FiUser className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-2">
                        Nome de Usuário
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 🔹 Alterar Senha */}
            <div className="lg:col-span-1 rounded-xl border border-black bg-black p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Alterar Senha</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="current-password">Senha Atual</label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-password">Nova Senha</label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="w-full px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Alterar Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AnimatedLayout>
  );
}
