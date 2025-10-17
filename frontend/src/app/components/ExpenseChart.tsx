// src/app/components/ExpenseChart.tsx
'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  type ChartData,
  type ChartOptions // <-- 1. Importe o tipo ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// 2. A interface agora aceita a prop 'options'
interface ExpenseChartProps {
  chartData: ChartData<'doughnut'>;
  options: ChartOptions<'doughnut'>;
}

const ExpenseChart = ({ chartData, options }: ExpenseChartProps) => { // <-- 3. Receba 'options' aqui
  const hasData = chartData?.datasets?.[0]?.data?.length > 0;

  if (!hasData) {
    return null; // Retorna nulo para não renderizar nada se não houver dados
  }

  // Opcional: Calcula o total para exibir no centro
  const totalExpenses = chartData.datasets[0].data.reduce((sum, value) => {
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  return (
    <div className="relative h-full w-full max-h-[300px] mx-auto flex items-center justify-center">
      {/* 4. As 'options' recebidas são passadas para o gráfico */}
      <Doughnut data={chartData} options={options} /> 
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase mb-1">Total</p>
        <p className="text-white text-2xl font-bold">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
        </p>
      </div>
    </div>
  );
};

export default ExpenseChart;