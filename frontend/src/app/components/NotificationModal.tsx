// components/NotificationModal.tsx
import React from 'react';
// [NOVO] Importe o ícone de check
import { FiX, FiBell, FiCheckCircle } from 'react-icons/fi';
import { Transaction } from './AddTransactionModal';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueToday: Transaction[];
  dueTomorrow: Transaction[];
  // [NOVO] Adicione uma prop para a função que marcará como pago
  onMarkAsPaid: (transactionId: number) => void;
}

// Componente para o item da lista
const NotificationCard: React.FC<{ 
  transaction: Transaction; 
  colorClass: string;
  // [NOVO] Receba a função aqui também
  onMarkAsPaid: (transactionId: number) => void;
}> = ({ transaction, colorClass, onMarkAsPaid }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <li className={`group flex items-center justify-between p-4 bg-slate-800/[0.6] hover:bg-slate-800/90 rounded-lg border-l-4 ${colorClass} transition-all duration-200`}>
      <div>
        <p className="font-semibold text-slate-100 text-base">{transaction.description}</p>
        <p className="text-sm text-slate-400">{transaction.category_name || 'Sem Categoria'}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className={`font-bold text-lg ${colorClass.replace('border-', 'text-')}`}>{formatCurrency(Number(transaction.amount))}</p>
        {/* [ALTERADO] Substituímos "Ver detalhes" pelo botão "Já Paguei" */}
        <button 
          onClick={() => onMarkAsPaid(transaction.id)}
          title="Marcar como pago (esconder notificação)"
          className="flex items-center justify-center bg-green-500/20 text-green-300 hover:bg-green-500/40 hover:text-white rounded-full h-10 w-10 transition-all duration-200"
        >
          <FiCheckCircle className="w-5 h-5" />
        </button>
      </div>
    </li>
  );
};

// [ATENÇÃO] Passe a nova prop 'onMarkAsPaid' para o componente
const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, dueToday, dueTomorrow, onMarkAsPaid }) => {
  if (!isOpen) return null;

  const hasNotifications = dueToday.length > 0 || dueTomorrow.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-95 animate-scale-up">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800/70 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <FiBell className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Notificações</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {!hasNotifications && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <FiBell className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-lg font-medium">Tudo em ordem!</p>
              <p className="text-sm text-slate-500">Você não possui contas vencendo hoje ou amanhã.</p>
            </div>
          )}

          {dueToday.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                Vencendo Hoje
                <span className="flex items-center justify-center bg-red-500/20 text-red-300 text-xs font-bold rounded-full h-5 w-5">
                  {dueToday.length}
                </span>
              </h4>
              <ul className="space-y-3">
                {dueToday.map((t) => (
                  // [ATENÇÃO] Passe a função onMarkAsPaid para o card
                  <NotificationCard key={t.id} transaction={t} colorClass="border-red-500" onMarkAsPaid={onMarkAsPaid} />
                ))}
              </ul>
            </div>
          )}

          {dueTomorrow.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                Vencendo Amanhã
                <span className="flex items-center justify-center bg-orange-500/20 text-orange-300 text-xs font-bold rounded-full h-5 w-5">
                  {dueTomorrow.length}
                </span>
              </h4>
              <ul className="space-y-3">
                {dueTomorrow.map((t) => (
                   // [ATENÇÃO] Passe a função onMarkAsPaid para o card
                  <NotificationCard key={t.id} transaction={t} colorClass="border-orange-500" onMarkAsPaid={onMarkAsPaid} />
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-800/70 flex justify-end sticky bottom-0 bg-gray-900/80 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-transparent border border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 text-slate-300 hover:text-white font-medium rounded-lg transition-all duration-200"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;