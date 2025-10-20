// components/AddProgressModal.tsx

'use client'

import React, { useState } from 'react';

// Interface da Meta (pode ser importada ou definida localmente)
interface BudgetGoal {
    id: number;
    name: string;
}

interface AddProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalId: number, amount: number) => void;
  goal: BudgetGoal | null;
}

const AddProgressModal: React.FC<AddProgressModalProps> = ({ isOpen, onClose, onSave, goal }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen || !goal) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('Por favor, insira um valor positivo.');
      return;
    }
    onSave(goal.id, numericAmount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">Adicionar Progresso</h2>
        <p className="text-gray-400 mb-6">Meta: <span className="font-semibold text-white">{goal.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="progress-amount" className="block text-sm font-medium text-gray-300">Valor a Adicionar</label>
            <input
              type="number"
              id="progress-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-green-500"
              required
              step="0.01"
              placeholder="Ex: 50,00"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProgressModal;