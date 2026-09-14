import { Usuario } from '../../domain/entities/Usuario';
import { Partida } from '../../domain/entities/Partida';
import { Solicitacao } from '../../domain/entities/Solicitacao';
import { Avaliacao } from '../../domain/entities/Avaliacao';
import { MensagemChat } from '../../domain/entities/MensagemChat';
import { AuditoriaLog } from '../../domain/entities/AuditoriaLog';

export interface IUsuarioRepository {
  criar(usuario: Usuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorCpf(cpf: string): Promise<Usuario | null>;
  listarTodos(): Promise<Usuario[]>;
  atualizar(usuario: Usuario): Promise<void>;
  softDelete(id: string, usuarioId: string): Promise<void>;
}

export interface ICodigoVerificacaoRepository {
  salvarCodigo(email: string, codigo: string, expiraEm: Date): Promise<void>;
  buscarCodigoValido(email: string, codigo: string): Promise<boolean>;
  consumirCodigo(email: string, codigo: string): Promise<void>;
}

export interface IPartidaRepository {
  criar(partida: Partida): Promise<Partida>;
  buscarPorId(id: string): Promise<Partida | null>;
  buscarPorRaio(lat: number, lng: number, raioMetros: number, esporte?: string, endereco?: string): Promise<Partida[]>;
  buscarPartidasExpiradas(agora?: Date): Promise<Partida[]>;
  atualizar(partida: Partida): Promise<void>;
  softDelete(id: string, usuarioId: string): Promise<void>;
  verificarConflitoHorarioOrganizador?(organizadorId: string, dataHora: Date, duracaoMinutos?: number): Promise<boolean>;
}

export interface ISolicitacaoDetalhada {
  id: string;
  partidaId: string;
  usuarioId: string;
  statusSolicitacao: string;
  dataRequisicao: Date;
  dataDecisao?: Date | null;
  atletaNome: string;
  atletaFoto?: string | null;
  atletaNota: number;
  atletaGenero: string;
  partidaEsporte: string;
  partidaDescricao?: string | null;
  partidaDataHora: Date;
  partidaBairro: string;
  organizadorId: string;
}

export interface ISolicitacaoRepository {
  criar(solicitacao: Solicitacao): Promise<Solicitacao>;
  buscarPorId(id: string): Promise<Solicitacao | null>;
  buscarPorPartidaEUsuario(partidaId: string, usuarioId: string): Promise<Solicitacao | null>;
  listarPorPartida(partidaId: string): Promise<Solicitacao[]>;
  listarPorUsuario(usuarioId: string): Promise<Solicitacao[]>;
  listarTodasDetalhes(): Promise<ISolicitacaoDetalhada[]>;
  atualizar(solicitacao: Solicitacao): Promise<void>;
  rejeitarPendentesPorPartida(partidaId: string): Promise<void>;
  // Regra RN01: Valida se o atleta tem partidas aprovadas em intervalo de +/- 2 horas
  verificarConflitoHorario(usuarioId: string, dataHoraPartida: Date): Promise<boolean>;
}

export interface IAvaliacaoDetalhada {
  id: string;
  nota: number;
  comentario?: string | null;
  dataAvaliacao: Date;
  avaliadorId: string;
  avaliadorNome: string;
  avaliadorFoto?: string | null;
  avaliadoId: string;
  avaliadoNome: string;
  avaliadoFoto?: string | null;
  partidaId?: string | null;
  partidaEsporte?: string | null;
  partidaBairro?: string | null;
}

export interface IAvaliacaoRepository {
  salvarOuAtualizar(avaliacao: Avaliacao): Promise<void>;
  listarTodasDetalhes(): Promise<IAvaliacaoDetalhada[]>;
  calcularMediaETotal(avaliadoId: string): Promise<{ notaMedia: number; totalAvaliacoes: number }>;
}

export interface IMensagemChatRepository {
  criar(mensagem: MensagemChat): Promise<MensagemChat>;
  listarPorPartida(partidaId: string): Promise<MensagemChat[]>;
}

export interface IAuditoriaRepository {
  salvar(log: AuditoriaLog): Promise<AuditoriaLog>;
  listarPorRegistro(tabelaNome: string, registroId: string): Promise<AuditoriaLog[]>;
  listarRecentes(limite?: number): Promise<AuditoriaLog[]>;
}

export interface IWebSocketNotificationService {
  notificarUsuario(usuarioId: string, event: string, payload: any): void;
  broadcastParaPartida(partidaId: string, event: string, payload: any): void;
  notificarPartidaFinalizada(partidaId: string): void;
}

export interface IPasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashed: string): Promise<boolean>;
}

export interface ITokenService {
  gerarToken(payload: { id: string; email: string }): string;
}
