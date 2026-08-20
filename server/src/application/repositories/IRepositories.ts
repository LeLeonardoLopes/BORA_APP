import { Usuario } from '../../domain/entities/Usuario';
import { Partida } from '../../domain/entities/Partida';
import { Solicitacao } from '../../domain/entities/Solicitacao';

export interface IUsuarioRepository {
  criar(usuario: Usuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  atualizar(usuario: Usuario): Promise<void>;
}

export interface IPartidaRepository {
  criar(partida: Partida): Promise<Partida>;
  buscarPorId(id: string): Promise<Partida | null>;
  buscarPorRaio(lat: number, lng: number, raioMetros: number, esporte?: string, endereco?: string): Promise<Partida[]>;
  atualizar(partida: Partida): Promise<void>;
}

export interface ISolicitacaoRepository {
  criar(solicitacao: Solicitacao): Promise<Solicitacao>;
  buscarPorId(id: string): Promise<Solicitacao | null>;
  buscarPorPartidaEUsuario(partidaId: string, usuarioId: string): Promise<Solicitacao | null>;
  listarPorPartida(partidaId: string): Promise<Solicitacao[]>;
  listarPorUsuario(usuarioId: string): Promise<Solicitacao[]>;
  atualizar(solicitacao: Solicitacao): Promise<void>;
  // Regra RN01: Valida se o atleta tem partidas aprovadas em intervalo de +/- 2 horas
  verificarConflitoHorario(usuarioId: string, dataHoraPartida: Date): Promise<boolean>;
}
