// src/app/components/AddCategoryModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export interface Category {
  id: number;
  name: string;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: { name: string }) => void;
  initialData?: Category | null;
}

const AddCategoryModal = ({ isOpen, onClose, onSave, initialData }: AddCategoryModalProps) => {
  const [name, setName] = useState('');
  const isEditMode = !!initialData;

  useEffect(() => {
    if (isEditMode && initialData) {
      setName(initialData.name);
    } else {
      setName('');
    }
  }, [isOpen, initialData, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name });
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
              required
            />
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

export default AddCategoryModal;