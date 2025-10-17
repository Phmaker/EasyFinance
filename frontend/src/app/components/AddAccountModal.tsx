// src/app/components/AddAccountModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export interface Account {
  id?: number;
  name: string;
  type: string;
  balance: number;
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<Account, 'id'>) => void;
  initialData?: Account | null;
}

const AddAccountModal = ({ isOpen, onClose, onSave, initialData }: AddAccountModalProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Conta Corrente');
  const [balance, setBalance] = useState('');

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isEditMode && initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setBalance(String(initialData.balance));
    } else {
      setName('');
      setType('Conta Corrente');
      setBalance('');
    }
  }, [isOpen, initialData, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, balance: parseFloat(balance) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {isEditMode ? 'Editar Conta' : 'Adicionar Nova Conta'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-slate-400 mb-2">Nome da Conta</label>
            <input
              type="text"
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="account-type" className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
              <select
                id="account-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
              >
                <option>Conta Corrente</option>
                <option>Cartão de Crédito</option>
                <option>Dinheiro</option>
                <option>Poupança</option>
                <option>Investimentos</option>
              </select>
            </div>
            <div>
              <label htmlFor="initial-balance" className="block text-sm font-medium text-slate-400 mb-2">Saldo Inicial (R$)</label>
              <input
                type="number"
                id="initial-balance"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-gray-800">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;