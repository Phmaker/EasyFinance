'use client'

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { Toaster, toast } from 'react-hot-toast';
import { FiMenu, FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import AddTransactionModal, { Transaction } from '../components/AddTransactionModal';
import { Category } from '../components/AddCategoryModal';
import { Account } from '../components/AddAccountModal';
import AnimatedLayout from '../components/AnimatedLayout';
import Sidebar from '../components/Sidebar';

const fetcher = (url: string) => api.get(url).then(res => res.data);

// Interface para a resposta paginada
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function TransactionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | ''>('');

  // SWR para buscar dados
  const { data: paginatedData, error, isLoading } =
    useSWR<PaginatedResponse<Transaction>>(`/transactions/?page=${page}`, fetcher, { keepPreviousData: true });
  // CORREÇÃO: Espera uma resposta paginada para categorias e contas
  const { data: categoriesData } = useSWR<PaginatedResponse<Category>>('/categories/', fetcher);
  const { data: accountsData } = useSWR<PaginatedResponse<Account>>('/accounts/', fetcher);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        await api.delete(`/transactions/${id}/`);
        toast.success('Lançamento excluído com sucesso!');
        mutate(`/transactions/?page=${page}`);
        mutate('/dashboard/');
      } catch {
        toast.error('Erro ao excluir lançamento.');
      }
    }
  };

  const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id' | 'category_type'>) => {
    const isEditing = !!editingTransaction;
    const promise = isEditing
      ? api.put(`/transactions/${editingTransaction.id}/`, transactionData)
      : api.post('/transactions/', transactionData);

    try {
      await promise;
      toast.success(`Lançamento ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
      setModalOpen(false);
      mutate(`/transactions/?page=${page}`);
      mutate('/dashboard/');
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao ${editingTransaction ? 'atualizar' : 'salvar'} lançamento.`);
    }
  };

  const handleNextPage = () => paginatedData?.next && setPage(p => p + 1);
  const handlePreviousPage = () => paginatedData?.previous && setPage(p => p - 1);
  const totalPages = paginatedData ? Math.ceil(paginatedData.count / 10) : 0;

  const filteredTransactions = useMemo(() => {
    if (!paginatedData?.results) return [];
    return paginatedData.results.filter((t) => {
      const transactionDate = new Date(t.date + 'T00:00:00');
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAccount = selectedAccount ? t.account === Number(selectedAccount) : true;
      const matchesCategory = selectedCategory ? t.category === Number(selectedCategory) : true;
      const matchesType = selectedType ? t.category_type === selectedType : true;
      const matchesStartDate = startDate ? transactionDate >= new Date(startDate + 'T00:00:00') : true;
      const matchesEndDate = endDate ? transactionDate <= new Date(endDate + 'T00:00:00') : true;
      return matchesSearch && matchesAccount && matchesCategory && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [paginatedData, searchTerm, selectedAccount, selectedCategory, selectedType, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchTerm(''); setSelectedAccount(''); setSelectedCategory(''); setSelectedType(''); setStartDate(''); setEndDate('');
  };

  return (
    <AnimatedLayout>
      <div className="flex h-screen overflow-hidden">
        <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        {isSidebarOpen && (<div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 lg:hidden"></div>)}
        <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Meus Lançamentos</h2>
              <p className="text-slate-400">Filtre e gerencie suas transações.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <FiPlus /> <span className="hidden sm:inline">Adicionar</span>
              </button>
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-800"><FiMenu className="w-6 h-6 text-white" /></button>
            </div>
          </header>

          {/* --- SEÇÃO DE FILTROS COM RESPONSIVIDADE APRIMORADA --- */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 flex items-center bg-slate-800 rounded-lg px-3">
                <FiSearch className="text-slate-400 mr-2" />
                <input type="text" placeholder="Buscar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent w-full outline-none text-slate-200 placeholder-slate-500 py-2"/>
              </div>
              <select 
                value={selectedType} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value as 'income' | 'expense' | '')} 
                className="bg-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none"
              >
                <option value="">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
              <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="bg-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none">
                <option value="">Todas as contas</option>
                {accountsData?.results?.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none">
                <option value="">Todas as categorias</option>
                {categoriesData?.results?.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-800 text-slate-200 rounded-lg px-3 py-2 w-full outline-none" title="Data inicial"/>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-800 text-slate-200 rounded-lg px-3 py-2 w-full outline-none" title="Data final"/>
              </div>
              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <button onClick={handleClearFilters} className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition">Limpar filtros</button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col rounded-xl border border-black bg-black overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto min-w-[700px]">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Descrição</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Categoria</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Conta</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Data</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Valor</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (<tr><td colSpan={6} className="text-center py-4 text-slate-400">Carregando...</td></tr>)}
                  {error && (<tr><td colSpan={6} className="text-center py-4 text-red-400">Erro ao carregar</td></tr>)}
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                      <td className="px-6 py-4 text-slate-200">{transaction.description}</td>
                      <td className="px-6 py-4 text-slate-400">{transaction.category_name}</td>
                      <td className="px-6 py-4 text-slate-400">{transaction.account_name}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${transaction.category_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleOpenEditModal(transaction)} className="text-slate-400 hover:text-blue-400"><FiEdit /></button>
                          <button onClick={() => handleDelete(transaction.id!)} className="text-slate-400 hover:text-red-400"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && !isLoading && (<tr><td colSpan={6} className="text-center py-6 text-slate-400">Nenhum lançamento encontrado.</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-auto p-4 border-t border-gray-800 text-slate-300">
              <button onClick={handlePreviousPage} disabled={!paginatedData?.previous || isLoading} className="px-4 py-2 bg-slate-800 rounded-md disabled:opacity-50 hover:bg-slate-700">Anterior</button>
              {totalPages > 0 && <span>Página {page} de {totalPages}</span>}
              <button onClick={handleNextPage} disabled={!paginatedData?.next || isLoading} className="px-4 py-2 bg-slate-800 rounded-md disabled:opacity-50 hover:bg-slate-700">Próximo</button>
            </div>
          </div>
        </main>
        
        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
          categories={categoriesData?.results}
          accounts={accountsData?.results}
        />
      </div>
    </AnimatedLayout>
  );
}