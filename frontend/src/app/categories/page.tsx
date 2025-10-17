// src/app/categories/page.tsx
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { Toaster, toast } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiMenu } from 'react-icons/fi';
import AddCategoryModal, { Category } from '../components/AddCategoryModal';
import AnimatedLayout from '../components/AnimatedLayout';
import Sidebar from '../components/Sidebar';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function CategoriesPage() {
  const { data: categories, error, isLoading } = useSWR<Category[]>('/categories/', fetcher);
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (idToDelete: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await api.delete(`/categories/${idToDelete}/`);
        toast.success('Categoria excluída com sucesso!');
        mutate('/categories/');
      } catch {
        toast.error('Erro ao excluir categoria.');
      }
    }
  };

  const handleSaveCategory = async (categoryData: { name: string }) => {
    const isEditing = !!editingCategory;
    const promise = isEditing
      ? api.put(`/categories/${editingCategory.id}/`, categoryData)
      : api.post('/categories/', categoryData);

    try {
      await promise;
      toast.success(`Categoria ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`);
      setModalOpen(false);
      mutate('/categories/');
    } catch {
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} categoria.`);
    }
  };

  return (
    <AnimatedLayout>
      <div className="flex h-screen overflow-hidden">
        <Toaster position="top-right" toastOptions={{
          style: { background: '#333', color: '#fff' },
        }} />

        {/* 🔹 Overlay quando sidebar estiver aberta */}
        {isSidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          ></div>
        )}

        {/* 🔹 Sidebar Reutilizável */}
        <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />

        {/* 🔹 Conteúdo principal */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Minhas Categorias</h2>
              <p className="text-slate-400">Crie e gerencie as categorias para seus lançamentos.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus />
                <span className="hidden sm:inline">Adicionar Categoria</span>
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-slate-800"
              >
                <FiMenu className="w-6 h-6 text-white" />
              </button>
            </div>
          </header>

          {/* 🔹 Lista de Categorias */}
          <div className="rounded-xl border border-black bg-black p-6">
            {isLoading && <p className="text-center text-slate-400">Carregando categorias...</p>}
            {error && <p className="text-center text-red-400">Falha ao carregar os dados.</p>}
            {categories && (
              <ul className="divide-y divide-gray-800">
                {categories.map(category => (
                  <li key={category.id} className="flex items-center justify-between py-4">
                    <span className="text-slate-200 font-medium">{category.name}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleOpenEditModal(category)}
                        className="text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id!)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        {/* 🔹 Modal de Adicionar/Editar Categoria */}
        <AddCategoryModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveCategory}
          initialData={editingCategory}
        />
      </div>
    </AnimatedLayout>
  );
}
