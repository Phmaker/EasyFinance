'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiChevronDown } from 'react-icons/fi';
import { Category } from './AddCategoryModal';
import { Account } from './AddAccountModal';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: number;
  account: number;
  category_name?: string;
  account_name?: string;
  category_type?: 'income' | 'expense';
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'category_type'>) => void;
  initialData?: Transaction | null;
  categories?: Category[];
  accounts?: Account[];
}

const AddTransactionModal = ({ isOpen, onClose, onSave, initialData, categories, accounts }: AddTransactionModalProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [isAccountOpen, setAccountOpen] = useState(false);
  
  const isEditMode = !!initialData;
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setDescription(initialData.description);
        setAmount(String(initialData.amount));
        setDate(initialData.date);
        setCategoryId(initialData.category);
        setAccountId(initialData.account);
      } else {
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategoryId('');
        setAccountId('');
      }
    }
  }, [isOpen, initialData, isEditMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !categoryId || !accountId) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    onSave({ 
      description, 
      amount: parseFloat(amount), 
      date, 
      category: Number(categoryId), 
      account: Number(accountId)
    });
    onClose();
  };
  
  const selectedCategory = categories?.find(c => c.id === categoryId);
  const selectedAccountName = accounts?.find(a => a.id === accountId)?.name || 'Selecione...';

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{isEditMode ? 'Editar Lançamento' : 'Adicionar Novo Lançamento'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1">Valor</label>
              <input type="number" step="0.01" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" required />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">Data</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative" ref={categoryDropdownRef}>
              <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
              <button type="button" onClick={() => setCategoryOpen(!isCategoryOpen)} className="w-full flex justify-between items-center rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500">
                <span className={`font-medium ${
                  selectedCategory?.type === 'income' ? 'text-green-400' :
                  selectedCategory?.type === 'expense' ? 'text-red-400' :
                  'text-white'
                }`}>
                  {selectedCategory?.name || 'Selecione...'}
                </span>
                <FiChevronDown className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryOpen && (
                <div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-40 overflow-y-auto">
                  {categories?.map(c => (
                    // --- CORREÇÃO AQUI ---
                    <div key={c.id} onClick={() => { setCategoryId(c.id || ''); setCategoryOpen(false); }} className="p-3 hover:bg-blue-600 cursor-pointer flex items-center gap-3">
                      <span className={`font-medium ${c.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={accountDropdownRef}>
              <label htmlFor="account" className="block text-sm font-medium text-slate-400 mb-1">Conta</label>
              <button type="button" onClick={() => setAccountOpen(!isAccountOpen)} className="w-full flex justify-between items-center rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500">
                <span>{selectedAccountName}</span>
                <FiChevronDown className={`transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAccountOpen && (
                <div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-40 overflow-y-auto">
                  {accounts?.map(a => (
                    // --- CORREÇÃO AQUI ---
                    <div key={a.id} onClick={() => { setAccountId(a.id || ''); setAccountOpen(false); }} className="p-3 hover:bg-blue-600 cursor-pointer">{a.name}</div>
                  ))}
                </div>
              )}
            </div>
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