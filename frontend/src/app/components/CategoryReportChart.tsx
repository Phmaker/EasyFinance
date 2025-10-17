'use client'

import React from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartOptions
} from 'chart.js';
import { FiInbox } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => api.get(url).then(res => res.data);

interface CategorySummary {
  category__name: string;
  total: number;
}

interface CategoryReportProps {
  period: string;
  category?: string; // ✅ agora aceita filtro opcional
}

const CategoryReportChart = ({ period, category }: CategoryReportProps) => {
  // ✅ monta o endpoint dinamicamente dependendo do filtro
  const endpoint = category
    ? `/reports/category-summary/?period=${period}&category=${category}`
    : `/reports/category-summary/?period=${period}`;

  const { data: summary, error, isLoading } = useSWR<CategorySummary[]>(endpoint, fetcher);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
        Carregando relatório...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Falha ao carregar relatório.
      </div>
    );

  if (!summary || summary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <FiInbox className="w-10 h-10 mb-2" />
        <p>Sem dados para este período.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const chartData = {
    labels: summary.map(item => item.category__name),
    datasets: [
      {
        label: category ? `Total em ${category}` : 'Total por Categoria',
        data: summary.map(item => item.total),
        backgroundColor: category ? '#10b981' : '#2563eb',
        borderColor: category ? '#059669' : '#3b82f6',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Total: ${formatCurrency(context.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-[400px] w-full">
      <Bar options={chartOptions} data={chartData} />
    </div>
  );
};

export default CategoryReportChart;
