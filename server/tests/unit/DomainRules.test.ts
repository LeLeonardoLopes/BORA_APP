import { Usuario } from '../../src/domain/entities/Usuario';
import { Partida } from '../../src/domain/entities/Partida';
import { StatusUsuarioEnum, StatusPartidaEnum } from '../../src/domain/enums/StatusEnums';

describe('Testes de Domínio & Regras de Negócio — Bora! App', () => {

  describe('Regra RN03 — Bloqueio de Cancelamento Direto para Partidas Lotadas', () => {
    it('deve permitir cancelar se a partida não estiver lotada', () => {
      const partida = new Partida({
        id: 'partida-1',
        organizadorId: 'user-organizador',
        esporte: 'Futebol Society',
        dataHora: new Date(Date.now() + 86400000),
        maxVagas: 10,
        vagasPreenchidas: 4,
        enderecoCompleto: 'Rua A, 123',
        bairro: 'São José',
        cidade: 'Franca',
        lat: -20.53,
        lng: -47.40,
        statusPartida: StatusPartidaEnum.PUBLICADA,
      });

      partida.cancelar('user-organizador');
      expect(partida.statusPartida).toBe(StatusPartidaEnum.CANCELADA);
    });

    it('deve lançar erro ao tentar cancelar partida com lotação esgotada (RN03)', () => {
      const partidaLotada = new Partida({
        id: 'partida-2',
        organizadorId: 'user-organizador',
        esporte: 'Beach Tennis',
        dataHora: new Date(Date.now() + 86400000),
        maxVagas: 4,
        vagasPreenchidas: 4,
        enderecoCompleto: 'Rua B, 456',
        bairro: 'Vila Nova',
        cidade: 'Franca',
        lat: -20.54,
        lng: -47.39,
        statusPartida: StatusPartidaEnum.LOTADA,
      });

      expect(() => {
        partidaLotada.cancelar('user-organizador');
      }).toThrow('Regra RN03: Partida com lotação esgotada não pode ser cancelada diretamente.');
    });
  });

  describe('Regra de Moderação & Suspensão Automática de Usuários', () => {
    it('deve suspender o usuário quando total de avaliações for >= 5 e nota média < 2.0', () => {
      const usuario = new Usuario({
        id: 'user-1',
        nome: 'Atleta Teste',
        email: 'atleta@teste.com',
        senhaHash: 'hash123',
        genero: 'Masculino',
        dataNascimento: new Date('1995-01-01'),
        raioBuscaKm: 5,
        notaMedia: 2.10,
        totalAvaliacoes: 4,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      });

      // 5ª avaliação com nota baixa (1 estrela) -> puxa a média para baixo de 2.0
      usuario.adicionarAvaliacao(1);

      expect(usuario.totalAvaliacoes).toBe(5);
      expect(usuario.notaMedia).toBeLessThan(2.0);
      expect(usuario.statusUsuario).toBe(StatusUsuarioEnum.SUSPENSO);
    });
  });
});
