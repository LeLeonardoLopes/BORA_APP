import { FastifyRequest, FastifyReply } from 'fastify';
import { CriarPartidaUseCase } from '../../application/use-cases/CriarPartidaUseCase';
import { ConsultarMapaPartidasUseCase } from '../../application/use-cases/ConsultarMapaPartidasUseCase';
import { CancelarPartidaUseCase } from '../../application/use-cases/CancelarPartidaUseCase';
import { FinalizarPartidaUseCase } from '../../application/use-cases/FinalizarPartidaUseCase';
import { SoftDeletePartidaUseCase } from '../../application/use-cases/SoftDeletePartidaUseCase';

export class PartidaController {
  constructor(
    private criarPartidaUseCase: CriarPartidaUseCase,
    private consultarMapaPartidasUseCase: ConsultarMapaPartidasUseCase,
    private cancelarPartidaUseCase: CancelarPartidaUseCase,
    private finalizarPartidaUseCase: FinalizarPartidaUseCase,
    private softDeletePartidaUseCase: SoftDeletePartidaUseCase
  ) {}

  public create = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const organizadorId = body.organizadorId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';

      const partida = await this.criarPartidaUseCase.execute({
        organizadorId,
        esporte: body.esporte,
        descricao: body.descricao,
        dataHora: body.dataHora || Date.now() + 86400000,
        duracaoMinutos: body.duracaoMinutos ? Number(body.duracaoMinutos) : 90,
        maxVagas: body.maxVagas ? Number(body.maxVagas) : 14,
        filtroGenero: body.filtroGenero,
        filtroNivel: body.filtroNivel,
        enderecoCompleto: body.enderecoCompleto,
        bairro: body.bairro,
        cidade: body.cidade || 'Franca',
        lat: Number(body.lat),
        lng: Number(body.lng),
        formatoJogo: body.formatoJogo,
        tipoLocal: body.tipoLocal,
        taxaCampo: body.taxaCampo ? Number(body.taxaCampo) : 0,
        taxaJuiz: body.taxaJuiz ? Number(body.taxaJuiz) : 0,
      });

      return reply.status(201).send({ data: partida });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public listMap = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = req.query as any;
      const lat = Number(query.lat) || -20.5388;
      const lng = Number(query.lng) || -47.4005;
      const radius = Number(query.radius) || 5;
      const endereco = query.endereco || query.bairro || query.q;
      const generoUsuario = query.genero || (req.user as any)?.genero;

      const partidas = await this.consultarMapaPartidasUseCase.execute({
        lat,
        lng,
        raioKm: radius,
        esporte: query.sport,
        endereco: typeof endereco === 'string' ? endereco : undefined,
        usuarioAutenticadoId: (req.user as any)?.id || 'anonymous',
        generoUsuario,
      });

      return reply.status(200).send({ data: partidas });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao consultar partidas: ' + err.message });
    }
  };

  public cancel = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const solicitanteId = (req.body as any)?.solicitanteId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';

      await this.cancelarPartidaUseCase.execute({
        partidaId: id,
        solicitanteId,
      });

      return reply.status(200).send({ message: 'Partida cancelada com sucesso.' });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public finish = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const solicitanteId = (req.body as any)?.solicitanteId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';

      await this.finalizarPartidaUseCase.execute({
        partidaId: id,
        solicitanteId,
      });

      return reply.status(200).send({ message: 'Partida finalizada com sucesso.' });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public delete = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const solicitanteId = (req.body as any)?.solicitanteId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
      const motivo = (req.body as any)?.motivo;

      await this.softDeletePartidaUseCase.execute({
        partidaId: id,
        solicitanteId,
        motivo,
      });

      return reply.status(200).send({ message: 'Partida excluída com sucesso (Soft Delete).' });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };
}
