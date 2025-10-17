// src/app/components/AddTransactionModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { FiX } from 'react-icons/fi';

// Importando os tipos que já criamos
import { Category } from './AddCategoryModal';
import { Account } from './AddAccountModal';

// Interface atualizada para usar IDs numéricos
export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: number; // Agora armazenamos o ID da categoria
  account: number;  // Agora armazenamos o ID da conta
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  initialData?: Transaction | null;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

const AddTransactionModal = ({ isOpen, onClose, onSave, initialData }: AddTransactionModalProps) => {
  // 1. Buscando categorias e contas da API para preencher os selects
  const { data: categories } = useSWR<Category[]>(isOpen ? '/categories/' : null, fetcher);
  const { data: accounts } = useSWR<Account[]>(isOpen ? '/accounts/' : null, fetcher);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [date, setDate] = useState('');

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setDescription(initialData.description);
        setAmount(String(initialData.amount));
        setType(initialData.type);
        setCategoryId(initialData.category);
        setAccountId(initialData.account);
        setDate(initialData.date);
      } else {
        // Reseta o formulário para o modo de adição
        setDescription('');
        setAmount('');
        setType('expense');
        setCategoryId('');
        setAccountId('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, initialData, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !accountId) {
      alert("Por favor, selecione uma categoria e uma conta.");
      return;
    }
    onSave({
      description,
      amount: parseFloat(amount),
      type,
      category: categoryId,
      account: accountId,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {isEditMode ? 'Editar Lançamento' : 'Adicionar Novo Lançamento'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50" required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-2">Valor (R$)</label>
              <input type="number" id="amount" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-2">Categoria</label>
              <select id="category" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50" required>
                <option value="" disabled>Selecione...</option>
                {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="account" className="block text-sm font-medium text-slate-400 mb-2">Conta</label>
              <select id="account" value={accountId} onChange={(e) => setAccountId(Number(e.target.value))} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50" required>
                <option value="" disabled>Selecione...</option>
                {accounts?.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          </div>

           <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-2">Data</label>
            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50" required />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-gray-800">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;