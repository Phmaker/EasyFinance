'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import api from '@/lib/api';
import Image from 'next/image';
import { 
  FiHome, FiRepeat, FiCreditCard, FiTag, FiUser, FiLogOut, FiMenu, FiBarChart2,
  FiTrendingUp, FiTrendingDown, FiDollarSign
} from 'react-icons/fi';
import AnimatedLayout from '../components/AnimatedLayout';
import CategoryReportChart from '../components/CategoryReportChart';

const fetcher = (url: string) => api.get(url).then(res => res.data);

// --- Componente StatCard ---
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  let valueColor = 'text-white';
  const numericValue = parseFloat(value.replace(/[^0-9.,-]+/g, "").replace('.', '').replace(',', '.'));
  if (numericValue > 0) valueColor = 'text-green-400';
  else if (numericValue < 0) valueColor = 'text-red-400';

  return (
    <div className="rounded-xl border border-black bg-black p-6 transition-transform transform hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
    </div>
  );
}

// --- Interface dos dados da API /api/analytics/ ---
interface AnalyticsData {
  kpis: {
    income: number;
    expenses: number;
    net_profit: number;
  };
}

// --- Página principal ---
export default function DashboardPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [period, setPeriod] = useState('this_month');

  const { data: analyticsData, error, isLoading } = useSWR<AnalyticsData>(`/analytics/?period=${period}`, fetcher);

  // --- Novos estados para filtro de categoria ---
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<{ income: number; expenses: number; percentage: number }>({
    income: 0,
    expenses: 0,
    percentage: 0,
  });

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const handleCategorySearch = async () => {
    if (!categorySearch.trim()) return;
    try {
      const res = await api.get(`/analytics/category/${categorySearch}?period=${period}`);
      setCategoryStats(res.data);
      setSelectedCategory(categorySearch);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const periodOptions = [
    { key: 'this_month', label: 'Este Mês' },
    { key: 'last_month', label: 'Mês Passado' },
    { key: 'last_90_days', label: 'Últimos 90 dias' },
    { key: 'this_year', label: 'Este Ano' },
  ];

  return (
    <AnimatedLayout>
      <div className="flex h-screen overflow-hidden">
        {isSidebarOpen && (<div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 lg:hidden"></div>)}

        {/* --- SIDEBAR --- */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-black p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div>
            <div className="flex justify-between items-center mb-10">
              <Image src="/Logofinance.png" alt="Finance Logo" width={200} height={200} priority />
            </div>
            <nav className="space-y-4">
              <a href="/home" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-400 hover:bg-blue-600/40 hover:text-white transition-colors"><FiHome className="w-5 h-5" /><span>Home</span></a>
              <a href="/dashboard" className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold transition-colors"><FiBarChart2 className="w-5 h-5" /><span>Dashboard</span></a>
              <a href="/transactions" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-400 hover:bg-blue-600/40 hover:text-white transition-colors"><FiRepeat className="w-5 h-5" /><span>Lançamentos</span></a>
              <a href="/accounts" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-400 hover:bg-blue-600/40 hover:text-white transition-colors"><FiCreditCard className="w-5 h-5" /><span>Contas</span></a>
              <a href="/categories" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-400 hover:bg-blue-600/40 hover:text-white transition-colors"><FiTag className="w-5 h-5" /><span>Categorias</span></a>
            </nav>
          </div>
          <div className="flex items-center justify-between">
            <a href="/profile" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-400 hover:bg-blue-600/40 hover:text-white transition-colors"><FiUser className="w-5 h-5" /><span>Minha Conta</span></a>
            <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors" title="Sair da conta"><FiLogOut className="w-5 h-5" /></button>
          </div>
        </aside>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Dashboard de Análise</h2>
              <p className="text-slate-400">Filtre e analise suas finanças em detalhes.</p>
            </div>
            <div className="flex items-center gap-2 bg-black p-1 rounded-lg border border-gray-800 self-start sm:self-center">
              {periodOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => setPeriod(option.key)}
                  className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                    period === option.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-800 absolute top-6 right-6"><FiMenu className="w-6 h-6 text-white" /></button>
          </header>
          
          {isLoading && <div className="text-center text-slate-400 py-10">Carregando dados...</div>}
          {error && <div className="text-center text-red-400 py-10">Erro ao carregar os dados.</div>}

          {analyticsData && !isLoading && (
            <div className="space-y-6">
              {/* --- KPIs --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total de Receitas" value={formatCurrency(analyticsData.kpis.income)} icon={FiTrendingUp} />
                <StatCard title="Total de Despesas" value={formatCurrency(analyticsData.kpis.expenses)} icon={FiTrendingDown} />
                <StatCard title="Lucro/Prejuízo" value={formatCurrency(analyticsData.kpis.net_profit)} icon={FiDollarSign} />
              </div>

              {/* --- FILTRO DE CATEGORIA E ANÁLISE DETALHADA --- */}
              <div className="rounded-xl border border-black bg-black p-6 space-y-4">
                <h3 className="font-semibold text-white mb-2">Análise por Categoria</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Selecione uma categoria para visualizar apenas as transações e percentuais relacionados a ela.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
                  <input
                    type="text"
                    placeholder="Digite o nome da categoria..."
                    className="w-full sm:w-1/2 p-2 rounded-md bg-slate-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                  <button
                    onClick={handleCategorySearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Filtrar
                  </button>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 transition-colors"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>

                {selectedCategory ? (
                  <div className="text-slate-300 space-y-2">
                    <h4 className="text-lg font-semibold text-white">Categoria: {selectedCategory}</h4>
                    <p className="text-sm text-slate-400">
                      Receita total: {formatCurrency(categoryStats.income)}<br />
                      Despesa total: {formatCurrency(categoryStats.expenses)}<br />
                      Porcentagem no período: <span className="text-blue-400">{categoryStats.percentage}%</span>
                    </p>
                    <div className="h-[300px]">
                      <CategoryReportChart period={period} category={selectedCategory} />
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 italic">Selecione uma categoria para ver os detalhes.</div>
                )}
              </div>

              {/* --- GRÁFICO GERAL --- */}
              <div className="rounded-xl border border-black bg-black p-6 min-h-[400px]">
                <h3 className="font-semibold mb-4 text-white">Gastos por Categoria no Período</h3>
                <div className="h-[350px]">
                  <CategoryReportChart period={period} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AnimatedLayout>
  );
}
