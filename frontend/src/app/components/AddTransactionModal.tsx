'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiChevronDown } from 'react-icons/fi';
import { Category } from './AddCategoryModal';
import { Account } from './AddAccountModal';

// 1. Interface da Transação (com campos de recorrência)
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
  is_recurring?: boolean;
  parent_transaction?: number | null;
}

// 2. Tipo específico para os dados que o formulário envia
interface TransactionSaveData {
  description: string;
  amount: number;
  date: string;
  category: number;
  account: number;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  apply_to_future?: boolean;
  recurrence_end_date?: string | null;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: TransactionSaveData) => void; 
  initialData?: Transaction | null;
  categories?: Category[];
  accounts?: Account[];
}

const AddTransactionModal = ({ isOpen, onClose, onSave, initialData, categories, accounts }: AddTransactionModalProps) => {
  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [isAccountOpen, setAccountOpen] = useState(false);
  
  // Estados para recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [applyToFuture, setApplyToFuture] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const isEditMode = !!initialData;
  const isPartOfSeries = initialData?.is_recurring || !!initialData?.parent_transaction;
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Efeito para popular ou resetar o formulário
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
      // Reseta os estados de recorrência toda vez que o modal abre
      setIsRecurring(false);
      setApplyToFuture(false);
      setRecurrenceEndDate('');
    }
  }, [isOpen, initialData, isEditMode]);

  // Efeito para fechar os dropdowns ao clicar fora
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

  // Função que monta e envia os dados do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !categoryId || !accountId) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const transactionData: TransactionSaveData = { 
      description, 
      amount: parseFloat(amount), 
      date, 
      category: Number(categoryId), 
      account: Number(accountId),
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? 'monthly' : null,
      apply_to_future: applyToFuture,
      recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
    };

    onSave(transactionData);
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
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1">Valor</label>
              <input type="number" step="0.01" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">Data</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative" ref={categoryDropdownRef}>
              <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
              <button type="button" onClick={() => setCategoryOpen(!isCategoryOpen)} className="w-full flex justify-between items-center rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    <div key={c.id} onClick={() => { setCategoryId(c.id || ''); setCategoryOpen(false); }} className="p-3 hover:bg-blue-600 cursor-pointer flex items-center gap-3">
                      <span className={`font-medium ${c.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={accountDropdownRef}>
              <label htmlFor="account" className="block text-sm font-medium text-slate-400 mb-1">Conta</label>
              <button type="button" onClick={() => setAccountOpen(!isAccountOpen)} className="w-full flex justify-between items-center rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span>{selectedAccountName}</span>
                <FiChevronDown className={`transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAccountOpen && (
                <div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-40 overflow-y-auto">
                  {accounts?.map(a => (
                    <div key={a.id} onClick={() => { setAccountId(a.id || ''); setAccountOpen(false); }} className="p-3 hover:bg-blue-600 cursor-pointer">{a.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Seção de Recorrência */}
          {!isEditMode && (
            <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_recurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-5 w-5 rounded accent-blue-500" />
                  <label htmlFor="is_recurring" className="text-slate-300 font-medium">Tornar este lançamento recorrente (mensal)</label>
              </div>
              
              {isRecurring && (
                  <div className="pl-8 animate-fade-in">
                      <label htmlFor="recurrence_end_date" className="block text-sm font-medium text-slate-400 mb-1">Repetir até (opcional):</label>
                      <input 
                          type="date" 
                          id="recurrence_end_date" 
                          value={recurrenceEndDate} 
                          onChange={(e) => setRecurrenceEndDate(e.target.value)} 
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min={date} 
                      />
                      <p className="text-xs text-slate-500 mt-1">Deixe em branco para repetir por 2 anos.</p>
                  </div>
              )}
            </div>
          )}

          {isEditMode && isPartOfSeries && (
            <div className="flex items-center gap-3 p-3 bg-blue-900/50 rounded-lg border border-blue-700">
              <input type="checkbox" id="apply_to_future" checked={applyToFuture} onChange={e => setApplyToFuture(e.target.checked)} className="h-5 w-5 rounded accent-blue-500" />
              <label htmlFor="apply_to_future" className="text-slate-200 font-semibold">Aplicar esta alteração às futuras recorrências</label>
            </div>
          )}
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-gray-800 font-medium">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;