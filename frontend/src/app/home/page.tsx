'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import api from '@/lib/api';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import {
    FiArrowUpRight, FiArrowDownRight, FiTrendingUp, FiTrendingDown, FiChevronLeft, FiChevronRight,
    FiMenu, FiArrowUpCircle, FiArrowDownCircle, FiArrowRight, FiInbox, FiBriefcase,
    FiTrendingUp as FiFuture, FiBell
} from 'react-icons/fi';
import ExpenseChart from '../components/ExpenseChart';
import { Transaction } from '../components/AddTransactionModal';
import AnimatedLayout from '../components/AnimatedLayout';
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';

// --- COMPONENTES INTERNOS ---

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    percentageChange?: number;
    changeType?: 'up' | 'down';
    changeText?: string;
}

function StatCard({ title, value, icon: Icon, percentageChange, changeType, changeText }: StatCardProps) {
    const changeColor = changeType === 'up' ? 'text-green-400' : 'text-red-400';
    const ChangeIcon = changeType === 'up' ? FiArrowUpRight : FiArrowDownRight;
    let valueColor = 'text-white';
    const isDynamicallyColored = title === 'Saldo Atual' || title === 'Saldo Projetado' || title === 'Lucro Líquido' || title === 'Variação do Lucro';
    if (isDynamicallyColored) {
        const numericValue = parseFloat(value.replace(/[^0-9.,-]+/g, "").replace('.', '').replace(',', '.'));
        if (numericValue > 0) valueColor = 'text-green-400';
        else if (numericValue < 0) valueColor = 'text-red-400';
    }
    return (
        <div className="rounded-xl border border-black bg-black p-6 flex flex-col justify-between min-h-[120px] transition-transform transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-slate-400">{title}</h3>
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
            <div>
                <p className={`text-xl md:text-2xl xl:text-3xl font-bold mt-2 whitespace-nowrap ${valueColor}`}>{value}</p>
                {percentageChange !== undefined && changeType && (
                    <div className="flex items-center gap-1 text-xs mt-1">
                        <span className={`flex items-center font-semibold ${changeColor}`}>
                            <ChangeIcon className="mr-1" />
                            {percentageChange}%
                        </span>
                        <span className="text-slate-500">{changeText || ''}</span>
                    </div>
                )}
                {changeText && percentageChange === undefined && (
                    <p className="text-xs mt-1 text-slate-500">{changeText}</p>
                )}
            </div>
        </div>
    );
}

interface Holiday { date: string; name: string; type: string; }
interface CalendarProps {
    upcomingTransactions: Transaction[];
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}

// [CORRIGIDO] Componente Calendar substituído pela nova versão
function Calendar({ upcomingTransactions, selectedDate, onDateSelect }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const year = currentDate.getFullYear();
    
    useEffect(() => {
        fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
            .then(response => response.json())
            .then(data => setHolidays(data))
            .catch(error => console.error("Erro ao buscar feriados:", error));
    }, [year]);

    const transactionsByDay = new Map();
    (upcomingTransactions || []).forEach(t => {
        const date = new Date(t.date + 'T00:00:00');
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!transactionsByDay.has(dayKey)) {
            transactionsByDay.set(dayKey, { hasIncome: false, hasExpense: false });
        }
        const dayData = transactionsByDay.get(dayKey);
        if (t.category_type === 'income') dayData.hasIncome = true;
        else dayData.hasExpense = true;
    });

    const handlePrevMonth = () => { 
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); 
    };
    
    const handleNextMonth = () => { 
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); 
    };
    
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
    const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => (
        <div key={`empty-${i}`}></div>
    ));

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const isSelected = selectedDate &&
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
        
        const dayKey = `${year}-${month}-${day}`;
        const dayTransactions = transactionsByDay.get(dayKey);
        const hasIncome = dayTransactions?.hasIncome || false;
        const hasExpense = dayTransactions?.hasExpense || false;
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const holiday = holidays.find(h => h.date === dateString);

        calendarDays.push(
            <div
                key={day}
                onClick={() => onDateSelect(dateObj)}
                className={`flex flex-col items-center justify-center p-0.5 h-8 w-full rounded transition-all duration-200 ease-in-out cursor-pointer group
                    ${isSelected 
                        ? 'bg-slate-800 ring-1 ring-blue-500' 
                        : 'hover:bg-slate-800'}
                `}
                title={holiday?.name || ''}
            >
                <span className={`
                    flex items-center justify-center h-6 w-6 text-xs rounded-full
                    ${isToday 
                        ? 'font-bold text-blue-400 border border-blue-500' 
                        : 'text-slate-200 group-hover:text-white'}
                    ${isSelected ? 'text-white' : ''}
                `}>
                    {day}
                </span>
                
                <div className="flex items-center justify-center h-1 mt-0.5 gap-0.5">
                    {hasIncome && <span className="w-1 h-1 bg-green-400 rounded-full" title="Receita neste dia"></span>}
                    {hasExpense && <span className="w-1 h-1 bg-red-400 rounded-full" title="Despesa neste dia"></span>}
                    {holiday && <span className="w-1 h-1 bg-yellow-400 rounded-full" title={holiday.name}></span>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-white text-sm">{`${formattedMonthName} ${year}`}</h3>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handlePrevMonth} 
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleNextMonth} 
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <FiChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 mb-1">
                {daysOfWeek.map(day => <div key={day} className="text-[10px]">{day}</div>)}
            </div>
            
            <div className="grid grid-cols-7 place-items-center text-center gap-0.5 flex-grow">
                {calendarDays}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        <span>Receita</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        <span>Despesa</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                        <span>Feriado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


interface TransactionItemProps { transaction: Transaction; }

function TransactionItem({ transaction }: TransactionItemProps) {
    const { category_type, description, date, amount } = transaction;
    const isIncome = category_type === 'income';
    const Icon = isIncome ? FiArrowUpCircle : FiArrowDownCircle;
    const color = isIncome ? 'text-green-400' : 'text-red-400';
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = new Date(date + 'T00:00:00');
    const diffTime = transactionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let dueDateText = '';
    if (isIncome) {
        if (diffDays < 0) dueDateText = `Recebido há ${Math.abs(diffDays)} dias`;
        else if (diffDays === 0) dueDateText = 'Recebido hoje';
        else if (diffDays === 1) dueDateText = 'Previsto para amanhã';
        else dueDateText = `Previsto para ${diffDays} dias`;
    } else {
        if (diffDays < 0) dueDateText = `Venceu há ${Math.abs(diffDays)} dias`;
        else if (diffDays === 0) dueDateText = 'Vence hoje';
        else if (diffDays === 1) dueDateText = 'Vence amanhã';
        else dueDateText = `Vence em ${diffDays} dias`;
    }
    return (
        <li className="flex items-center justify-between py-3 border-b border-gray-800 last:border-none">
            <div className="flex items-center gap-4">
                <Icon className={`w-6 h-6 flex-shrink-0 ${color}`} />
                <div>
                    <p className="font-medium text-slate-200">{description}</p>
                    <p className="text-sm text-slate-400">{dueDateText}</p>
                </div>
            </div>
            <p className={`font-semibold whitespace-nowrap ${color}`}>{isIncome ? `+ ${formattedAmount}` : `- ${formattedAmount}`}</p>
        </li>
    );
}

// --- FIM DOS COMPONENTES INTERNOS ---

const fetcher = (url: string) => api.get(url).then(res => res.data);

interface DashboardData {
    summary: {
        actual_balance: number;
        projected_balance: number;
        monthly_income: number;
        monthly_expenses: number;
        net_profit: number;
        net_profit_variation: number;
    };
    expense_chart: { labels: string[]; data: number[]; };
    upcoming_transactions: Transaction[];
    notifications: {
        due_today: Transaction[];
        due_tomorrow: Transaction[];
    };
}
interface UserProfile {
    username: string;
}

export default function HomePage() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const router = useRouter();

    const { data: userProfile } = useSWR<UserProfile>('/user/profile/', fetcher);
    const { data: dashboardData, error, isLoading } = useSWR<DashboardData>('/dashboard/', fetcher);
    
    const [visibleNotifications, setVisibleNotifications] = useState<{ due_today: Transaction[], due_tomorrow: Transaction[] }>({ due_today: [], due_tomorrow: [] });
    const [expenseData, setExpenseData] = useState<ChartData<'doughnut'>>({ labels: [], datasets: [] });
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        if (dashboardData?.notifications) {
            const storedPaidIds = localStorage.getItem('paidNotificationIds');
            const paidIds: number[] = storedPaidIds ? JSON.parse(storedPaidIds) : [];

            const filteredToday = dashboardData.notifications.due_today.filter(
                t => !paidIds.includes(t.id)
            );
            const filteredTomorrow = dashboardData.notifications.due_tomorrow.filter(
                t => !paidIds.includes(t.id)
            );

            setVisibleNotifications({
                due_today: filteredToday,
                due_tomorrow: filteredTomorrow
            });
        }
    }, [dashboardData]);

    useEffect(() => {
        const hasBeenAcknowledged = sessionStorage.getItem('notificationsAcknowledged') === 'true';
        const hasVisibleNotifications = visibleNotifications.due_today.length > 0 || visibleNotifications.due_tomorrow.length > 0;

        if (!hasBeenAcknowledged && hasVisibleNotifications) {
            setNotificationModalOpen(true);
        }
    }, [visibleNotifications]);

    useEffect(() => {
        if (dashboardData?.expense_chart) {
            const formattedData: ChartData<'doughnut'> = {
                labels: dashboardData.expense_chart.labels,
                datasets: [{
                    label: 'Despesas do Mês', data: dashboardData.expense_chart.data,
                    backgroundColor: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
                    borderColor: '#000', borderWidth: 2,
                    hoverBackgroundColor: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                }],
            };
            setExpenseData(formattedData);
        }
    }, [dashboardData]);

    const getNext30DaysTransactions = (transactions: Transaction[]): Transaction[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            return transactionDate >= today && transactionDate <= thirtyDaysFromNow;
        });
    };

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || isNaN(value)) return "R$ 0,00";
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    
    const handleMarkAsPaid = (transactionId: number) => {
        const storedPaidIds = localStorage.getItem('paidNotificationIds');
        const paidIds: number[] = storedPaidIds ? JSON.parse(storedPaidIds) : [];

        if (!paidIds.includes(transactionId)) {
            const newPaidIds = [...paidIds, transactionId];
            localStorage.setItem('paidNotificationIds', JSON.stringify(newPaidIds));
        }

        setVisibleNotifications(prev => ({
            due_today: prev.due_today.filter(t => t.id !== transactionId),
            due_tomorrow: prev.due_tomorrow.filter(t => t.id !== transactionId),
        }));
    };
    
    const handleCloseModal = () => {
        setNotificationModalOpen(false);
        sessionStorage.setItem('notificationsAcknowledged', 'true');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('notificationsAcknowledged');
        Cookies.remove('auth_token');
        router.push('/login');
    };

    const handleDateSelect = (date: Date) => {
        if (selectedDate && selectedDate.getTime() === date.getTime()) {
            setSelectedDate(null);
        } else {
            setSelectedDate(date);
        }
    };

    const upcomingTransactions = dashboardData?.upcoming_transactions || [];
    const next30DaysTransactions = getNext30DaysTransactions(upcomingTransactions);

    const filteredTransactions = (selectedDate 
        ? next30DaysTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            return (
                transactionDate.getFullYear() === selectedDate.getFullYear() &&
                transactionDate.getMonth() === selectedDate.getMonth() &&
                transactionDate.getDate() === selectedDate.getDate()
            );
        })
        : next30DaysTransactions
    );

    const totalVisibleNotifications = (visibleNotifications.due_today.length || 0) + 
                                        (visibleNotifications.due_tomorrow.length || 0);

    const chartOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: '#94a3b8', boxWidth: 12, padding: 20 },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#cbd5e1',
                bodyColor: '#cbd5e1',
                padding: 10,
                callbacks: {
                    label: function (context: TooltipItem<'doughnut'>) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ${formatCurrency(value)}`;
                    }
                }
            }
        }
    };

    return (
        <AnimatedLayout>
            <div className="flex h-screen overflow-hidden">
                {isSidebarOpen && (<div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 lg:hidden"></div>)}
                <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white">
                                Olá, Bem-vindo {userProfile ? userProfile.username : '...'}! ☕
                            </h2>
                            <p className="text-slate-400">Aqui está o resumo financeiro do seu mês.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setNotificationModalOpen(true)}
                                className="relative p-2 rounded-md hover:bg-slate-800 transition-colors"
                                title="Ver Notificações"
                            >
                                <FiBell className="w-6 h-6 text-white" />
                                {totalVisibleNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                        {totalVisibleNotifications}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-800"><FiMenu className="w-6 h-6 text-white" /></button>
                        </div>
                    </header>
                    
                    {error && !isLoading &&
                        <div className="rounded-xl border border-red-900 bg-red-950 p-6 text-center text-red-400 mb-6">
                            Erro ao carregar dados. Sua sessão pode ter expirado.
                        </div>
                    }

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
                        {isLoading ? <div className="col-span-full rounded-xl border border-black bg-black p-6 text-center text-slate-400 animate-pulse">Carregando painel...</div>
                            : error ? null
                                : (
                                    <>
                                        <StatCard title="Saldo Atual" value={formatCurrency(dashboardData?.summary?.actual_balance)} icon={FiBriefcase} />
                                        <StatCard title="Saldo Projetado" value={formatCurrency(dashboardData?.summary?.projected_balance)} icon={FiFuture} />
                                        <StatCard title="Receitas do Mês" value={formatCurrency(dashboardData?.summary?.monthly_income)} icon={FiTrendingUp} />
                                        <StatCard title="Despesas do Mês" value={formatCurrency(dashboardData?.summary?.monthly_expenses)} icon={FiTrendingDown} />
                                        <StatCard
                                            title="Variação do Lucro"
                                            value={`${(dashboardData?.summary?.net_profit_variation ?? 0) >= 0 ? '+' : ''}${(dashboardData?.summary?.net_profit_variation ?? 0).toFixed(2)}%`}
                                            icon={(dashboardData?.summary?.net_profit_variation ?? 0) >= 0 ? FiTrendingUp : FiTrendingDown}
                                            changeText="vs mês anterior"
                                        />
                                    </>
                                )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="rounded-xl border border-black bg-black p-6 h-96">
                                <h3 className="font-semibold mb-4 text-white">Visão Geral de Despesas</h3>
                                <div className="relative h-full w-full max-h-[300px] mx-auto">
                                    {isLoading && <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Carregando gráfico...</div>}
                                    {dashboardData?.expense_chart?.data.length === 0 && !isLoading && !error ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                            <FiInbox className="w-10 h-10 mb-2" />
                                            <p>Nenhuma despesa este mês.</p>
                                        </div>
                                    ) : ( expenseData.datasets.length > 0 && !error && <ExpenseChart chartData={expenseData} options={chartOptions} />)}
                                </div>
                            </div>

                            <div className="rounded-xl border border-black bg-black p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-white">
                                        {selectedDate
                                            ? `Lançamentos de ${selectedDate.toLocaleDateString('pt-BR')}`
                                            : "Próximos Lançamentos (30 dias)"
                                        }
                                    </h3>
                                    <a href="/transactions" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-semibold">
                                        Ver todos <FiArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                                <ul className="flex flex-col">
                                    {isLoading && <p className="text-slate-500 text-sm animate-pulse">Carregando lançamentos...</p>}
                                    {filteredTransactions && filteredTransactions.length > 0 && !error ? (
                                        filteredTransactions.map((transaction) => (
                                            <TransactionItem key={transaction.id} transaction={transaction} />
                                        ))
                                    ) : (
                                        !isLoading && !error && (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <FiInbox className="w-10 h-10 text-slate-600 mb-2" />
                                                <p className="text-slate-500 text-sm">
                                                    {selectedDate ? "Nenhum lançamento para este dia." : "Nenhum lançamento nos próximos 30 dias."}
                                                </p>
                                                <p className="text-slate-600 text-xs">
                                                    {selectedDate ? "" : "Você está em dia!"}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* LINHA ALTERADA ABAIXO */}
                        <div className="lg:col-span-1 rounded-xl border border-black bg-black p-4 h-96">
                            <Calendar
                                upcomingTransactions={next30DaysTransactions}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                            />
                        </div>
                   </div>
                </main>
            </div>
            
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={handleCloseModal}
                dueToday={visibleNotifications.due_today}
                dueTomorrow={visibleNotifications.due_tomorrow}
                onMarkAsPaid={handleMarkAsPaid}
            />
        </AnimatedLayout>
    );
}