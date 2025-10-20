'use client';

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

// Interfaces
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface BudgetGoal {
  id?: number;
  name: string;
  goal_type: 'spending_limit' | 'saving_goal';
  target_amount: number;
  current_amount?: number;
  category?: number | null;
  start_date: string;
  end_date: string;
}

// Payload atualizado para ser mais flexível
export interface BudgetGoalPayload {
  name: string;
  target_amount: number;
  start_date: string;
  end_date: string;
  goal_type: 'spending_limit' | 'saving_goal';
  category: number | null;
  current_amount?: number;
}

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: BudgetGoalPayload, id?: number) => void; // Assinatura atualizada
  initialData?: BudgetGoal | null;
  categories?: Category[];
}

const AddGoalModal = ({ isOpen, onClose, onSave, initialData, categories }: AddGoalModalProps) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalType, setGoalType] = useState<'spending_limit' | 'saving_goal'>('spending_limit');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentAmount, setCurrentAmount] = useState(''); // Para 'saving_goal'

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setName(initialData.name);
        setTargetAmount(String(initialData.target_amount));
        setGoalType(initialData.goal_type);
        setSelectedCategory(initialData.category || '');
        setStartDate(initialData.start_date);
        setEndDate(initialData.end_date);
        setCurrentAmount(String(initialData.current_amount || ''));
      } else {
        // Resetar para o estado inicial
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setGoalType('spending_limit');
        setSelectedCategory('');
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDayOfMonth);
        setEndDate(lastDayOfMonth);
      }
    }
  }, [isOpen, initialData, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalType === 'spending_limit' && !selectedCategory) {
      alert("Por favor, selecione uma categoria para o limite de gasto.");
      return;
    }

    const payload: BudgetGoalPayload = {
      name,
      goal_type: goalType,
      target_amount: parseFloat(targetAmount),
      category: goalType === 'spending_limit' ? Number(selectedCategory) : null,
      start_date: startDate,
      end_date: endDate,
      current_amount: goalType === 'saving_goal' && currentAmount ? parseFloat(currentAmount) : undefined,
    };

    // Chama onSave com o ID se estiver no modo de edição
    onSave(payload, initialData?.id);
  };

  const expenseCategories = categories?.filter(c => c.type === 'expense');

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {isEditMode ? 'Editar Meta' : 'Adicionar Nova Meta'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Meta</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setGoalType('spending_limit')} className={`px-4 py-2.5 text-sm rounded-lg font-semibold transition-all ${goalType === 'spending_limit' ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-800 text-slate-300 hover:bg-gray-700'}`}>
                Limite de Gasto
              </button>
              <button type="button" onClick={() => setGoalType('saving_goal')} className={`px-4 py-2.5 text-sm rounded-lg font-semibold transition-all ${goalType === 'saving_goal' ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-800 text-slate-300 hover:bg-gray-700'}`}>
                Meta de Economia
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium text-slate-400 mb-1">Nome da Meta</label>
            <input type="text" id="goal-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" placeholder={goalType === 'spending_limit' ? "Ex: Limite de Lazer" : "Ex: Economia para Viagem"} required />
          </div>

          {goalType === 'spending_limit' ? (
            <div>
              <label htmlFor="goal-category" className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
              <select 
                id="goal-category" 
                value={selectedCategory} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(Number(e.target.value))} 
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" 
                required
              >
                <option value="" disabled>Selecione uma categoria de despesa...</option>
                {expenseCategories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
                <label htmlFor="current-amount" className="block text-sm font-medium text-slate-400 mb-1">Valor Inicial Guardado (Opcional)</label>
                <input type="number" step="0.01" id="current-amount" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" placeholder="Ex: 150,00" />
            </div>
          )}

          <div>
            <label htmlFor="target-amount" className="block text-sm font-medium text-slate-400 mb-1">Valor Alvo</label>
            <input type="number" step="0.01" id="target-amount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" placeholder="Ex: 800,00" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-slate-400 mb-1">Data de Início</label>
                <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" required />
            </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-slate-400 mb-1">Data Final</label>
                <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500" required />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-gray-800">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-500" disabled={!name || !targetAmount}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;