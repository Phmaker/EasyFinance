'use client';

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

// 1. A interface agora inclui o campo 'type'
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 2. onSave agora espera receber o objeto completo
  onSave: (category: Omit<Category, 'id'>) => void;
  initialData?: Category | null;
}

const AddCategoryModal = ({ isOpen, onClose, onSave, initialData }: AddCategoryModalProps) => {
  const [name, setName] = useState('');
  // 3. Novo estado para controlar o tipo da categoria
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setName(initialData.name);
        setType(initialData.type); // Carrega o tipo da categoria em modo de edição
      } else {
        // Reseta o formulário ao abrir para adicionar uma nova categoria
        setName('');
        setType('expense');
      }
    }
  }, [isOpen, initialData, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return; // Validação para não salvar nome vazio
    onSave({ name, type }); // 4. Envia o nome e o tipo ao salvar
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {isEditMode ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-slate-400 mb-2">Nome da Categoria</label>
            <input
              type="text"
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-blue-500 focus:ring-blue-500/50"
              placeholder="Ex: Salário, Alimentação..."
              required
            />
          </div>

          {/* 5. Novo campo para selecionar o tipo da categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`px-4 py-2.5 text-sm rounded-lg font-semibold transition-all duration-200 ${
                  type === 'expense' 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                  : 'bg-gray-800 text-slate-300 hover:bg-gray-700'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`px-4 py-2.5 text-sm rounded-lg font-semibold transition-all duration-200 ${
                  type === 'income' 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                  : 'bg-gray-800 text-slate-300 hover:bg-gray-700'
                }`}
              >
                Receita
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-gray-800">
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed"
              disabled={!name.trim()}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;