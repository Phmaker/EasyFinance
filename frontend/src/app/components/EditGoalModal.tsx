// components/EditGoalModal.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { BudgetGoalPayload } from './AddGoalModal'; // Reutilizando o tipo

// Definindo a interface Category aqui para o componente ser autônomo
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

// Definindo a interface BudgetGoal aqui
interface BudgetGoal {
    id: number;
    name: string;
    goal_type: 'spending_limit' | 'saving_goal';
    target_amount: number;
    current_amount: number;
    category_name?: string;
    category: number | null;
    start_date: string;
    end_date: string;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalId: number, data: BudgetGoalPayload) => void;
  goal: BudgetGoal | null;
  categories?: Category[];
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ isOpen, onClose, onSave, goal, categories }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goalType, setGoalType] = useState<'spending_limit' | 'saving_goal'>('spending_limit');
  const [currentAmount, setCurrentAmount] = useState(''); // Apenas para metas de economia

  useEffect(() => {
    // Preenche o formulário quando uma meta é selecionada
    if (goal) {
      setName(goal.name);
      setTargetAmount(String(goal.target_amount));
      setCategory(goal.category);
      setStartDate(goal.start_date);
      setEndDate(goal.end_date);
      setGoalType(goal.goal_type);
      setCurrentAmount(String(goal.current_amount));
    }
  }, [goal]);

  if (!isOpen || !goal) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: BudgetGoalPayload = {
      name,
      target_amount: parseFloat(targetAmount),
      start_date: startDate,
      end_date: endDate,
      goal_type: goalType,
      category: goalType === 'spending_limit' ? category : null,
      current_amount: goalType === 'saving_goal' ? parseFloat(currentAmount) : undefined,
    };
    
    onSave(goal.id, payload);
  };

  const expenseCategories = categories?.filter(c => c.type === 'expense');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Editar Meta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nome da Meta</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-300">Valor Alvo</label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
              required
              step="0.01"
            />
          </div>
          
          {/* O tipo da meta não pode ser alterado na edição para manter a simplicidade */}
          <p className="text-sm text-gray-400">
            Tipo: <span className="font-semibold text-white">{goalType === 'spending_limit' ? 'Limite de Gasto' : 'Meta de Economia'}</span>
          </p>

          {goalType === 'spending_limit' && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300">Categoria de Despesa</label>
              <select
                id="category"
                value={category || ''}
                onChange={(e) => setCategory(Number(e.target.value))}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>Selecione...</option>
                {expenseCategories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {goalType === 'saving_goal' && (
            <div>
              <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-300">Valor Inicial Guardado</label>
              <input
                type="number"
                id="currentAmount"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>
          )}

          <div className="flex gap-4">
            <div className="w-1/2">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Data de Início</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">Data Final</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;