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

  describe('Regra RN04 — Precificação de Espaços Públicos vs Privados & Arbitragem', () => {
    it('deve lançar erro se taxa de campo for cobrada em local público', () => {
      expect(() => {
        new Partida({
          id: 'partida-pub-com-taxa',
          organizadorId: 'user-organizador',
          esporte: 'Futebol de 7 (Terrão)',
          dataHora: new Date(Date.now() + 86400000),
          maxVagas: 14,
          vagasPreenchidas: 1,
          tipoLocal: 'Publica',
          taxaCampo: 100, // Proibido em espaço público
          enderecoCompleto: 'Parque Progresso',
          bairro: 'Progresso',
          cidade: 'Franca',
          lat: -20.54,
          lng: -47.39,
          statusPartida: StatusPartidaEnum.PUBLICADA,
        });
      }).toThrow('Regra RN04: Campos e quadras públicas são 100% gratuitos. A taxa de campo não se aplica.');
    });

    it('deve lançar erro se taxa de juiz for cobrada em partidas normais/avulsas', () => {
      expect(() => {
        new Partida({
          id: 'partida-avulsa-com-juiz',
          organizadorId: 'user-organizador',
          esporte: 'Futebol Society',
          dataHora: new Date(Date.now() + 86400000),
          maxVagas: 14,
          vagasPreenchidas: 1,
          formatoJogo: 'Avulso',
          tipoLocal: 'Privada',
          taxaCampo: 150,
          taxaJuiz: 80, // Proibido em partidas avulsas
          enderecoCompleto: 'Arena Show',
          bairro: 'Vila Nova',
          cidade: 'Franca',
          lat: -20.54,
          lng: -47.39,
          statusPartida: StatusPartidaEnum.PUBLICADA,
        });
      }).toThrow('Regra RN04: A taxa de arbitragem/juiz aplica-se exclusivamente a amistosos entre equipes.');
    });

    it('deve permitir amistoso em campo público com taxa de juiz opcional', () => {
      const amistosoPublico = new Partida({
        id: 'amistoso-pub',
        organizadorId: 'user-organizador',
        esporte: 'Futebol de Campo (11x11)',
        dataHora: new Date(Date.now() + 86400000),
        maxVagas: 2,
        vagasPreenchidas: 1,
        formatoJogo: 'Amistoso_Times',
        tipoLocal: 'Publica',
        taxaCampo: 0,
        taxaJuiz: 80,
        enderecoCompleto: 'Campo do Continental',
        bairro: 'São José',
        cidade: 'Franca',
        lat: -20.53,
        lng: -47.40,
        statusPartida: StatusPartidaEnum.PUBLICADA,
      });

      expect(amistosoPublico.taxaCampo).toBe(0);
      expect(amistosoPublico.taxaJuiz).toBe(80);
      expect(amistosoPublico.valorPorEquipe).toBe(40); // 80 / 2
    });

    it('deve permitir amistoso em campo privado com taxa de campo e taxa de juiz', () => {
      const amistosoPrivado = new Partida({
        id: 'amistoso-priv',
        organizadorId: 'user-organizador',
        esporte: 'Futebol Society',
        dataHora: new Date(Date.now() + 86400000),
        maxVagas: 2,
        vagasPreenchidas: 1,
        formatoJogo: 'Amistoso_Times',
        tipoLocal: 'Privada',
        taxaCampo: 180,
        taxaJuiz: 60,
        enderecoCompleto: 'Arena Society',
        bairro: 'Vila Nova',
        cidade: 'Franca',
        lat: -20.52,
        lng: -47.41,
        statusPartida: StatusPartidaEnum.PUBLICADA,
      });

      expect(amistosoPrivado.taxaCampo).toBe(180);
      expect(amistosoPrivado.taxaJuiz).toBe(60);
      expect(amistosoPrivado.valorPorEquipe).toBe(120); // (180 + 60) / 2
    });
  });
});
