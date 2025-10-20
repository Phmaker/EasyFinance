import axios from 'axios';
import Cookies from 'js-cookie';

// Cria uma instância do Axios com configurações padrão
const api = axios.create({
    baseURL: 'http://192.168.15.19:8000/api', // A URL base da sua API Django
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Requisição: Adiciona o token a cada requisição
api.interceptors.request.use((config) => {
    // Apenas confirme se o nome do seu cookie é exatamente 'auth_token'
    const token = Cookies.get('auth_token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor de Resposta: Lida com erros de autenticação globalmente
api.interceptors.response.use(
    // Se a resposta for bem-sucedida, apenas a retorna.
    (response) => response,

    // Se a resposta der erro...
    (error) => {
        // Verifica se o erro é uma resposta da API com status
        // 401 (Não Autorizado) OU 403 (Proibido)
        if (error.response?.status === 401 || error.response?.status === 403) {
            
            console.error("Erro de autenticação/permissão. Redirecionando para o login...");

            // Limpa o cookie de autenticação, pois ele é inválido ou expirou
            Cookies.remove('auth_token'); 

            // Limpa o sessionStorage para garantir que o modal de notificação apareça no próximo login
            sessionStorage.removeItem('notificationsAcknowledged');

            // Redireciona o usuário para a página de login
            // A verificação `typeof window` garante que o código só rode no navegador
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        
        // Para qualquer outro tipo de erro, a promise é rejeitada para que
        // o erro possa ser tratado no local da chamada (ex: no useSWR).
        return Promise.reject(error);
    }
);

export default api;