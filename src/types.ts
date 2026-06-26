export interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
  createdAt: string;
}

export interface OsItem {
  estoqueId?: string;
  descricao: string;
  qtd: number;
  valor: number;
}

export interface OS {
  id: string;
  codigo: string;
  clienteId: string;
  responsavel: string;
  situacao: 'Em espera' | 'Em andamento' | 'Concluído' | 'Entregue';
  dataInicio: string;
  dataEntrega?: string;
  motivo?: string;
  servico?: string;
  produtos: OsItem[];
  desconto: number;
  valorTotal: number;
  observacoes?: string;
  media?: MediaItem[];
  createdAt: string;
}

export interface Servico {
  id: string;
  nome: string;
  categoria?: string;
  tempo?: string;
  preco: number;
  precoMax?: number;
  descricao?: string;
  obs?: string;
  createdAt: string;
}

export interface EstoqueItem {
  id: string;
  nome: string;
  categoria?: string;
  unidade: string;
  qtd: number;
  qtdMin: number;
  custo: number;
  venda: number;
  obs?: string;
  createdAt: string;
}

export interface Movimentacao {
  id: string;
  itemId: string;
  itemNome: string;
  tipo: 'entrada' | 'saida' | 'baixa' | 'ajuste';
  qtd: number;
  custo: number;
  motivo?: string;
  osId?: string;
  osRef?: string;
  data: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

export interface Arquivo {
  id: string;
  nome: string;
  tipo: string;
  mime: string;
  tamanho: number;
  dataUrl: string;
  createdAt: string;
}

export interface ZinnxsDB {
  clientes: Cliente[];
  ordens: OS[];
  servicos: Servico[];
  estoque: EstoqueItem[];
  movimentacoes: Movimentacao[];
  arquivos: Arquivo[];
  lastOS: number;
}
