// src/app/accounts/page.tsx
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { Toaster, toast } from 'react-hot-toast';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiMenu
} from 'react-icons/fi';
import AddAccountModal, { Account } from '../components/AddAccountModal';
import AnimatedLayout from '../components/AnimatedLayout';
import Sidebar from '../components/Sidebar';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AccountsPage() {
  const router = useRouter();
  const { data: accounts, error, isLoading } = useSWR<Account[]>('/accounts/', fetcher);
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (account: Account) => {
    setEditingAccount(account);
    setModalOpen(true);
  };

  const handleDelete = async (idToDelete: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta conta?")) {
      try {
        await api.delete(`/accounts/${idToDelete}/`);
        toast.success('Conta excluída com sucesso!');
        mutate('/accounts/');
      } catch {
        toast.error('Erro ao excluir conta.');
      }
    }
  };

  const handleSaveAccount = async (accountData: Omit<Account, 'id'>) => {
    const isEditing = !!editingAccount;
    const promise = isEditing
      ? api.put(`/accounts/${editingAccount.id}/`, accountData)
      : api.post('/accounts/', accountData);

    try {
      await promise;
      toast.success(`Conta ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`);
      setModalOpen(false);
      mutate('/accounts/');
    } catch {
      toast.error(`Erro ao ${editingAccount ? 'atualizar' : 'salvar'} conta.`);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Conta Corrente': return '🏦';
      case 'Cartão de Crédito': return '💳';
      default: return '💰';
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
        <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Minhas Contas</h2>
              <p className="text-slate-400">Gerencie suas contas bancárias, cartões e carteiras.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus />
                <span className="hidden sm:inline">Adicionar Conta</span>
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-slate-800"
              >
                <FiMenu className="w-6 h-6 text-white" />
              </button>
            </div>
          </header>

          {/* 🔹 Grid de Contas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && <p className="text-center text-slate-400 col-span-full">Carregando contas...</p>}
            {error && <p className="text-center text-red-400 col-span-full">Erro ao carregar as contas.</p>}

            {accounts?.map(account => (
              <div
                key={account.id}
                className="rounded-xl border border-black bg-black p-6 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">{account.name}</h3>
                    <p className="text-sm text-slate-400">{account.type}</p>
                  </div>
                  <span className="text-2xl">{getAccountIcon(account.type)}</span>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Saldo</p>
                  <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(account.balance)}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-4 mt-4">
                  <button
                    onClick={() => handleOpenEditModal(account)}
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id!)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 🔹 Modal de Adicionar/Editar Conta */}
        <AddAccountModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveAccount}
          initialData={editingAccount}
        />
      </div>
    </AnimatedLayout>
  );
}
