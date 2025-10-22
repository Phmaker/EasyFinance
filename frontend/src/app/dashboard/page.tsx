'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import api from '@/lib/api';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { Toaster, toast } from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import { FiMenu, FiTrendingUp, FiTrendingDown, FiDollarSign, FiHash, FiActivity, FiTag, FiChevronDown, FiPlusCircle, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import AnimatedLayout from '../components/AnimatedLayout';

// Importando os modais
import AddGoalModal, { BudgetGoalPayload } from '../components/AddGoalModal';
import AddProgressModal from '../components/AddProgressModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const fetcher = (url: string) => api.get(url).then(res => res.data);

// --- FUNÇÃO DE FORMATAÇÃO CENTRALIZADA ---
const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// --- INTERFACES DE DADOS ---
interface Category { id: number; name: string; type: 'income' | 'expense'; }
interface PaginatedCategoryResponse { results: Category[]; }
interface CategoryStats { income: number; expenses: number; percentage: number; type: 'income' | 'expense'; }
interface CompositionData { category__name: string; total: number; }
interface TimeseriesData { labels: string[]; income_data: number[]; expense_data: number[]; }
interface AnalyticsData {
    kpis: {
        income: number;
        expenses: number;
        net_profit: number;
        average_daily_expense: number;
        income_transactions: number;
        expense_transactions: number;
        top_expense_category: { name: string; amount: number } | null;
    };
    income_composition: CompositionData[];
    expense_composition: CompositionData[];
    timeseries_data: TimeseriesData;
}
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

// --- COMPONENTES COM ESTILO ---
interface StatCardProps { title: string; value: number | string | undefined | null; icon: React.ElementType; subtitle?: string; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle }) => {
    const isNumeric = typeof value === 'number';
    const formattedValue = isNumeric ? formatCurrency(value) : String(value || '0');

    let valueColor = 'text-white';
    if (isNumeric) {
        if (value > 0 && (title.includes('Receitas') || title.includes('Lucro'))) valueColor = 'text-green-400';
        else if (value < 0 || title.includes('Despesas') || title.includes('Gasto')) valueColor = 'text-red-400';
    }

    return (
        <div className="rounded-xl border border-black bg-black p-4 transition-all duration-200 hover:border-slate-700 flex flex-col justify-between min-h-[110px] w-full">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-slate-400 truncate">{title}</h3>
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                </div>
                <p className={`text-xl font-bold ${valueColor} break-words`}>
                    {formattedValue}
                </p>
                {subtitle && (
                    <p className="text-xs text-slate-500 font-medium truncate mt-1" title={subtitle}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

const DoughnutChart = ({ title, data, colors }: { title: string; data: CompositionData[]; colors: string[] }) => {
    const chartData = {
        labels: data?.map(d => d.category__name),
        datasets: [{ data: data?.map(d => d.total), backgroundColor: colors, borderColor: '#0A0E1A', borderWidth: 4, hoverOffset: 8 }]
    };
    const options = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: data && data.length > 0, position: 'bottom' as const, labels: { color: '#9ca3af', padding: 15, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 12 } } } } };
    return (
        <div className="bg-black rounded-xl p-4 sm:p-6 border border-slate-900 h-full flex flex-col">
            <h3 className="font-semibold text-white mb-4 text-base">{title}</h3>
            <div className="relative flex-grow flex items-center justify-center min-h-[250px]">
                {data && data.length > 0 ? <Doughnut data={chartData} options={options} /> : <p className="text-slate-500 text-sm">Sem dados no período</p>}
            </div>
        </div>
    );
};

const LineChart = ({ title, data }: { title: string; data: TimeseriesData }) => {
    const chartData = {
        labels: data?.labels,
        datasets: [
            { label: 'Receitas', data: data?.income_data, borderColor: 'rgb(74, 222, 128)', backgroundColor: 'rgba(74, 222, 128, 0.1)', fill: true, tension: 0.4, pointBackgroundColor: 'rgb(74, 222, 128)' },
            { label: 'Despesas', data: data?.expense_data, borderColor: 'rgb(248, 113, 113)', backgroundColor: 'rgba(248, 113, 113, 0.1)', fill: true, tension: 0.4, pointBackgroundColor: 'rgb(248, 113, 113)' }
        ]
    };
    const options = { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: '#9ca3af', font: { size: 12 } }, grid: { color: 'rgba(55, 65, 81, 0.5)' } }, x: { ticks: { color: '#9ca3af', font: { size: 12 } }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#d1d5db', font: { size: 12 } } } } };
    return (
        <div className="rounded-xl border border-black bg-black p-4 sm:p-6">
            <h3 className="font-semibold text-white mb-4 text-base">{title}</h3>
            <div className="h-80"><Line data={chartData} options={options} /></div>
        </div>
    );
};

const BudgetGoals = ({ goals, onAddClick, onEditClick, onDeleteClick, onAddProgressClick }: {
    goals: BudgetGoal[]; onAddClick: () => void; onEditClick: (goal: BudgetGoal) => void; onDeleteClick: (id: number) => void; onAddProgressClick: (goal: BudgetGoal) => void;
}) => {
    const getProgressBarColor = (goal: BudgetGoal) => { const progress = (goal.current_amount / goal.target_amount) * 100; if (goal.goal_type === 'spending_limit') { if (progress > 100) return 'bg-red-500'; if (progress > 80) return 'bg-yellow-500'; return 'bg-blue-600'; } return 'bg-green-500'; };
    const getAmountColor = (goal: BudgetGoal) => { if (goal.goal_type === 'spending_limit' && goal.current_amount > goal.target_amount) { return 'text-red-400'; } return 'text-white'; }

    return (
        <div className="rounded-xl border border-black bg-black p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-white text-lg">Metas</h3>
                <button onClick={onAddClick} className="text-blue-400 hover:text-blue-300 transition-colors" title="Adicionar nova meta"><FiPlusCircle size={20}/></button>
            </div>
            <div className="space-y-6">
                {goals?.length > 0 ? goals.map(goal => (
                    <div key={goal.id} className="flex flex-col">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <div className="flex-1 min-w-0"><span className="font-semibold text-slate-200 truncate block">{goal.name}</span>{goal.category_name && <span className="text-slate-500 text-xs truncate block">({goal.category_name})</span>}</div>
                            <span className={`font-medium ${getAmountColor(goal)} text-sm ml-2 flex-shrink-0`}>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-1"><div className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(goal)}`} style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}></div></div>
                        <div className="flex justify-end items-center gap-4 mt-2">
                            {goal.goal_type === 'saving_goal' && (<button onClick={() => onAddProgressClick(goal)} className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 text-xs font-semibold" title="Adicionar Progresso"><FiPlus size={12}/> <span>Progresso</span></button>)}
                            <button onClick={() => onEditClick(goal)} className="text-slate-400 hover:text-white transition-colors" title="Editar Meta"><FiEdit size={16} /></button>
                            <button onClick={() => onDeleteClick(goal.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Excluir Meta"><FiTrash2 size={16} /></button>
                        </div>
                    </div>
                )) : (<p className="text-slate-500 text-sm text-center py-4">Nenhuma meta criada ainda.</p>)}
            </div>
        </div>
    );
};

// --- Página principal ---
export default function DashboardPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const [period, setPeriod] = useState('this_year');

    const { data: analyticsData, error, isLoading } = useSWR<AnalyticsData>(`/analytics/?period=${period}`, fetcher);
    const { data: categoriesData } = useSWR<PaginatedCategoryResponse>('/categories/user-list/', fetcher);
    const { data: goalsData, mutate: mutateGoals } = useSWR<BudgetGoal[]>('/budget-goals/', fetcher);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
    const [isCategoryLoading, setCategoryLoading] = useState(false);
    const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [isAddProgressModalOpen, setAddProgressModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<BudgetGoal | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!selectedCategory) { setCategoryStats(null); return; }
        const fetchCategoryStats = async () => {
            setCategoryLoading(true);
            try { const res = await api.get(`/analytics/category-details/?name=${selectedCategory}&period=${period}`); setCategoryStats(res.data); } catch (error) { console.error(error); setCategoryStats(null); }
            finally { setCategoryLoading(false); }
        };
        fetchCategoryStats();
    }, [selectedCategory, period]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) { if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) { setCategoryDropdownOpen(false); } }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => { Cookies.remove('auth_token'); router.push('/login'); };
    const periodOptions = [
        { key: 'this_month', label: 'Este Mês' }, { key: 'last_month', label: 'Mês Passado' }, { key: 'last_90_days', label: 'Últimos 90 dias' }, { key: 'this_year', label: 'Este Ano' }
    ];
    const selectedCategoryObject = useMemo(() => categoriesData?.results?.find(c => c.name === selectedCategory), [categoriesData, selectedCategory]);
    const handleSaveOrUpdateGoal = (goalData: BudgetGoalPayload, id?: number) => { const apiCall = id ? api.put(`/budget-goals/${id}/`, goalData) : api.post('/budget-goals/', goalData); toast.promise(apiCall.then(() => mutateGoals()), { loading: 'Salvando...', success: id ? 'Meta atualizada!' : 'Meta criada!', error: id ? 'Erro ao atualizar.' : 'Erro ao criar.' }).finally(() => setGoalModalOpen(false)); };
    const handleAddProgress = async (goalId: number, amount: number) => { try { await api.post(`/budget-goals/${goalId}/add-progress/`, { amount }); mutateGoals(); setAddProgressModalOpen(false); toast.success('Progresso adicionado!'); } catch (err) { toast.error('Erro ao adicionar progresso.'); } };
    const handleDeleteGoal = async (id: number) => { if (window.confirm('Tem certeza?')) { try { await api.delete(`/budget-goals/${id}/`); toast.success('Meta excluída!'); mutateGoals(); } catch (err) { toast.error('Erro ao excluir.'); } } };
    const openAddModal = () => { setSelectedGoal(null); setIsEditMode(false); setGoalModalOpen(true); };
    const openEditModal = (goal: BudgetGoal) => { setSelectedGoal(goal); setIsEditMode(true); setGoalModalOpen(true); };
    const openAddProgressModal = (goal: BudgetGoal) => { setSelectedGoal(goal); setAddProgressModalOpen(true); };
    
    const MainContent = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Total de Receitas" value={analyticsData?.kpis?.income} icon={FiTrendingUp} />
                <StatCard title="Total de Despesas" value={analyticsData?.kpis?.expenses} icon={FiTrendingDown} />
                <StatCard title="Lucro/Prejuízo" value={analyticsData?.kpis?.net_profit} icon={FiDollarSign} />
                <StatCard title="Gasto Médio Diário" value={analyticsData?.kpis?.average_daily_expense} icon={FiActivity} />
                <StatCard title="Transações" value={`${analyticsData?.kpis?.income_transactions ?? 0} / ${analyticsData?.kpis?.expense_transactions ?? 0}`} subtitle="Receitas / Despesas" icon={FiHash} />
                <StatCard title="Principal Gasto" value={analyticsData?.kpis?.top_expense_category?.amount} subtitle={analyticsData?.kpis?.top_expense_category?.name ?? 'Nenhuma despesa'} icon={FiTag} />
            </div>

            <div className="rounded-xl border border-black bg-black p-4 sm:p-6 space-y-4">
                <h3 className="font-semibold text-white text-base">Análise por Categoria</h3>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative w-full sm:w-1/2" ref={categoryDropdownRef}>
                        <button type="button" onClick={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)} className="w-full flex justify-between items-center p-3 rounded-md bg-slate-900 text-white border border-gray-700 text-sm" disabled={!categoriesData}>
                            <span className={`font-medium truncate ${selectedCategoryObject?.type === 'income' ? 'text-green-400' : selectedCategoryObject?.type === 'expense' ? 'text-red-400' : 'text-slate-400'}`}>{selectedCategoryObject?.name || 'Selecione uma categoria...'}</span>
                            <FiChevronDown className={`transition-transform flex-shrink-0 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isCategoryDropdownOpen && (<div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-60 overflow-y-auto">{categoriesData?.results?.map((category) => (<div key={category.id} onClick={() => { setSelectedCategory(category.name); setCategoryDropdownOpen(false); }} className="p-3 hover:bg-blue-600 cursor-pointer text-sm"><span className={`font-medium ${category.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{category.name}</span></div>))}</div>)}
                    </div>
                    {selectedCategory && (<button onClick={() => setSelectedCategory(null)} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 text-sm w-full sm:w-auto">Limpar</button>)}
                </div>
                {isCategoryLoading && <p className="text-slate-400 animate-pulse text-sm">Analisando...</p>}
                {!isCategoryLoading && categoryStats && selectedCategory && (<div className="bg-slate-900/50 p-4 rounded-lg space-y-4"><h4 className="text-lg font-semibold text-white">Resultados para: {selectedCategory}</h4>{categoryStats.type === 'income' ? (<div><p className="text-sm text-slate-400">Receita Total</p><p className="text-2xl font-bold text-green-400">{formatCurrency(categoryStats.income)}</p><div className="mt-4"><div className="flex justify-between items-center mb-1"><span className="text-sm text-slate-400">Representa no total</span><span className="text-sm font-bold text-white">{categoryStats.percentage.toFixed(1)}%</span></div><div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(categoryStats.percentage, 100)}%` }}></div></div></div></div>) : (<div><p className="text-sm text-slate-400">Despesa Total</p><p className="text-2xl font-bold text-red-400">{formatCurrency(categoryStats.expenses)}</p><div className="mt-4"><div className="flex justify-between items-center mb-1"><span className="text-sm text-slate-400">Representa no total</span><span className="text-sm font-bold text-white">{categoryStats.percentage.toFixed(1)}%</span></div><div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(categoryStats.percentage, 100)}%` }}></div></div></div></div>)}</div>)}
                {!selectedCategory && !isCategoryLoading && (<div className="text-slate-500 italic text-sm">Selecione uma categoria para ver os detalhes.</div>)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">{analyticsData && (<LineChart title={`Receitas vs. Despesas (${periodOptions.find(p => p.key === period)?.label})`} data={analyticsData.timeseries_data} />)}</div>
                <div className="flex flex-col gap-6">{analyticsData && (<DoughnutChart title="Composição das Receitas" data={analyticsData.income_composition} colors={['#2563eb', '#3b82f6', '#60a5fa']} />)}{analyticsData && (<DoughnutChart title="Composição das Despesas" data={analyticsData.expense_composition} colors={['#ef4444', '#f87171', '#fca5a5']} />)}</div>
            </div>
            
            <div><BudgetGoals goals={goalsData || []} onAddClick={openAddModal} onEditClick={openEditModal} onDeleteClick={handleDeleteGoal} onAddProgressClick={openAddProgressModal} /></div>
        </div>
    );

    return (
        <AnimatedLayout>
            <div className="flex h-screen overflow-hidden">
                <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
                <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />
                
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
                    {/* ALTERAÇÃO: A estrutura do header foi ajustada para o comportamento de quebra de linha */}
                    <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className='flex-1'>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Dashboard de Análise</h2>
                            <p className="text-slate-400 text-base">Filtre e analise suas finanças em detalhes.</p>
                        </div>
                        
                        {/* ALTERAÇÃO: O container dos botões agora usa 'flex-wrap' */}
                        <div className="flex flex-wrap items-center gap-1 bg-black p-1 rounded-lg border border-gray-800 w-full sm:w-auto">
                           {periodOptions.map(option => (
                               <button 
                                   key={option.key} 
                                   onClick={() => setPeriod(option.key)} 
                                   // ALTERAÇÃO: Botões agora se expandem em telas pequenas ('flex-1')
                                   className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex-1 sm:flex-none text-center ${period === option.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                               > 
                                   {option.label} 
                               </button>
                           ))}
                        </div>

                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="lg:hidden p-2 rounded-md hover:bg-slate-800 absolute top-4 right-4"
                        >
                            <FiMenu className="w-6 h-6 text-white" />
                        </button>
                    </header>

                    {isLoading && <div className="text-center text-slate-400 py-10">Carregando dashboard...</div>}
                    {error && <div className="text-center text-red-400 py-10">Erro ao carregar os dados.</div>}
                    {analyticsData && !isLoading && <MainContent />}
                </main>

                <AddGoalModal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} onSave={handleSaveOrUpdateGoal} initialData={isEditMode ? selectedGoal : null} categories={categoriesData?.results} />
                <AddProgressModal isOpen={isAddProgressModalOpen} onClose={() => setAddProgressModalOpen(false)} onSave={handleAddProgress} goal={selectedGoal} />
            </div>
        </AnimatedLayout>
    );
}