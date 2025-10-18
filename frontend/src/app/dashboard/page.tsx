'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'; // 1. Adicionado useRef
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import api from '@/lib/api';
import Sidebar from '../components/Sidebar';
import { 
  FiMenu, FiTrendingUp, FiTrendingDown, FiDollarSign, FiHash, FiActivity, FiTag,
  FiChevronDown // 2. Adicionado ícone para o dropdown
} from 'react-icons/fi';
import AnimatedLayout from '../components/AnimatedLayout';
import CategoryReportChart from '../components/CategoryReportChart';

const fetcher = (url: string) => api.get(url).then(res => res.data);

// --- Interfaces de Dados ---
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense'; // Garante que o tipo está na interface
}
interface PaginatedCategoryResponse {
    results: Category[];
}
interface CategoryStats {
    income: number;
    expenses: number;
    percentage: number;
    type: 'income' | 'expense';
}
interface AnalyticsData {
  kpis: {
    income: number;
    expenses: number;
    net_profit: number;
    average_daily_expense: number;
    income_transactions: number;
    expense_transactions: number;
    top_expense_category: {
      name: string;
      amount: number;
    } | null;
  };
}

// ... (Componente StatCard sem alterações) ...
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
}
function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  let valueColor = 'text-white';
  const numericValue = parseFloat(value.replace(/[^0-9.,-]+/g, "").replace('.', '').replace(',', '.'));
  
  if (numericValue > 0 && (title.includes('Receitas') || title.includes('Lucro'))) valueColor = 'text-green-400';
  else if (numericValue < 0 || title.includes('Despesas') || title.includes('Gasto')) valueColor = 'text-red-400';

  return (
    <div className="rounded-xl border border-black bg-black p-6 transition-transform transform hover:-translate-y-1 flex flex-col justify-between min-h-[120px]">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-500 font-medium truncate" title={subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

// --- Página principal ---
export default function DashboardPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [period, setPeriod] = useState('this_year');

  const { data: analyticsData, error, isLoading } = useSWR<AnalyticsData>(`/analytics/?period=${period}`, fetcher);
  const { data: categories } = useSWR<PaginatedCategoryResponse>('/categories/user-list/', fetcher);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const [isCategoryLoading, setCategoryLoading] = useState(false);

  // 3. Estados e Ref para o dropdown customizado
  const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryStats(null);
      return;
    }
    const fetchCategoryStats = async () => {
      setCategoryLoading(true);
      try {
        const res = await api.get(`/analytics/category-details/?name=${selectedCategory}&period=${period}`);
        setCategoryStats(res.data);
      } catch (error) {
        console.error('Erro ao buscar stats da categoria:', error);
        setCategoryStats(null);
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategoryStats();
  }, [selectedCategory, period]);
  
  // Efeito para fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  const periodOptions = [
    { key: 'this_month', label: 'Este Mês' },
    { key: 'last_month', label: 'Mês Passado' },
    { key: 'last_90_days', label: 'Últimos 90 dias' },
    { key: 'this_year', label: 'Este Ano' },
  ];

  // Lógica para pegar o objeto da categoria selecionada
  const selectedCategoryObject = useMemo(() => 
    categories?.results?.find(c => c.name === selectedCategory),
  [categories, selectedCategory]);

  const MainContent = () => (
    <div className="space-y-6">
      {/* KPIs Gerais (sem alteração) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <StatCard title="Total de Receitas" value={formatCurrency(analyticsData?.kpis.income)} icon={FiTrendingUp} />
        <StatCard title="Total de Despesas" value={formatCurrency(analyticsData?.kpis.expenses)} icon={FiTrendingDown} />
        <StatCard title="Lucro/Prejuízo" value={formatCurrency(analyticsData?.kpis.net_profit)} icon={FiDollarSign} />
        <StatCard title="Gasto Médio Diário" value={formatCurrency(analyticsData?.kpis.average_daily_expense)} icon={FiActivity} />
        <StatCard title="Transações no Período" value={`${analyticsData?.kpis.income_transactions ?? 0} / ${analyticsData?.kpis.expense_transactions ?? 0}`} subtitle="Receitas / Despesas" icon={FiHash} />
        <StatCard title="Principal Gasto" value={formatCurrency(analyticsData?.kpis.top_expense_category?.amount)} subtitle={analyticsData?.kpis.top_expense_category?.name ?? 'Nenhuma despesa'} icon={FiTag} />
      </div>

      <div className="rounded-xl border border-black bg-black p-6 space-y-4">
        <h3 className="font-semibold text-white mb-2">Análise por Categoria</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
          {/* --- 4. SUBSTITUIÇÃO DO <select> POR UM DROPDOWN CUSTOMIZADO --- */}
          <div className="relative w-full sm:w-1/2" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full flex justify-between items-center p-2 rounded-md bg-slate-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={!categories}
            >
              <span className={`font-medium ${
                selectedCategoryObject?.type === 'income' ? 'text-green-400' :
                selectedCategoryObject?.type === 'expense' ? 'text-red-400' :
                'text-slate-400'
              }`}>
                {selectedCategoryObject?.name || 'Selecione uma categoria...'}
              </span>
              <FiChevronDown className={`transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-60 overflow-y-auto">
                {categories?.results?.map((category) => (
                  <div 
                    key={category.id} 
                    onClick={() => { setSelectedCategory(category.name); setCategoryDropdownOpen(false); }} 
                    className="p-3 hover:bg-blue-600 cursor-pointer"
                  >
                    <span className={`font-medium ${category.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedCategory && (<button onClick={() => setSelectedCategory(null)} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700">Limpar</button>)}
        </div>

        {isCategoryLoading && <p className="text-slate-400 animate-pulse">Analisando categoria...</p>}
        
        {/* Painel Adaptável (sem alterações) */}
        {!isCategoryLoading && categoryStats && selectedCategory && (
          <div className="bg-slate-900/50 p-4 rounded-lg space-y-4">
            <h4 className="text-lg font-semibold text-white">Resultados para: {selectedCategory}</h4>
            {categoryStats.type === 'income' && ( <div> {/* ... Lógica para Receita ... */} </div> )}
            {categoryStats.type === 'expense' && ( <div> {/* ... Lógica para Despesa ... */} </div> )}
          </div>
        )}

        {!selectedCategory && !isCategoryLoading && (<div className="text-slate-500 italic">Selecione uma categoria para ver os detalhes.</div>)}
      </div>

      <div className="rounded-xl border border-black bg-black p-6 min-h-[400px]">
        <h3 className="font-semibold mb-4 text-white">Gastos por Categoria no Período</h3>
        <div className="h-[350px]"><CategoryReportChart period={period} /></div>
      </div>
    </div>
  );

  return (
    <AnimatedLayout>
      <div className="flex h-screen overflow-hidden">
        {isSidebarOpen && (<div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 lg:hidden"></div>)}
        <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Dashboard de Análise</h2>
              <p className="text-slate-400">Filtre e analise suas finanças em detalhes.</p>
            </div>
            <div className="flex items-center gap-2 bg-black p-1 rounded-lg border border-gray-800 self-start sm:self-center">
              {periodOptions.map(option => ( <button key={option.key} onClick={() => setPeriod(option.key)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${period === option.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}> {option.label} </button> ))}
            </div>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-800 absolute top-6 right-6"><FiMenu className="w-6 h-6 text-white" /></button>
          </header>
          {isLoading && <div className="text-center text-slate-400 py-10">Carregando KPIs...</div>}
          {error && <div className="text-center text-red-400 py-10">Erro ao carregar os dados.</div>}
          {analyticsData && !isLoading && <MainContent />}
        </main>
      </div>
    </AnimatedLayout>
  );
}