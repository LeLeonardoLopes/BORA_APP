import { FastifyRequest, FastifyReply } from 'fastify';
import { CriarPartidaUseCase } from '../../application/use-cases/CriarPartidaUseCase';
import { ConsultarMapaPartidasUseCase } from '../../application/use-cases/ConsultarMapaPartidasUseCase';
import { CancelarPartidaUseCase } from '../../application/use-cases/CancelarPartidaUseCase';
import { FinalizarPartidaUseCase } from '../../application/use-cases/FinalizarPartidaUseCase';
import { SoftDeletePartidaUseCase } from '../../application/use-cases/SoftDeletePartidaUseCase';
import { IPartidaRepository } from '../../application/repositories/IRepositories';

export class PartidaController {
  constructor(
    private criarPartidaUseCase: CriarPartidaUseCase,
    private consultarMapaPartidasUseCase: ConsultarMapaPartidasUseCase,
    private cancelarPartidaUseCase: CancelarPartidaUseCase,
    private finalizarPartidaUseCase: FinalizarPartidaUseCase,
    private softDeletePartidaUseCase: SoftDeletePartidaUseCase,
    private partidaRepo?: IPartidaRepository
  ) {}

  private extrairSolicitanteId(req: FastifyRequest): string {
    const bodyId = (req.body as any)?.solicitanteId || (req.body as any)?.organizadorId;
    const queryId = (req.query as any)?.solicitanteId || (req.query as any)?.organizadorId || (req.query as any)?.usuarioId;
    const headerUserId = (req.headers as any)?.['x-user-id'];

    if (bodyId && typeof bodyId === 'string' && bodyId.trim()) return bodyId.trim();
    if (queryId && typeof queryId === 'string' && queryId.trim()) return queryId.trim();
    if (headerUserId && typeof headerUserId === 'string' && headerUserId.trim()) return headerUserId.trim();

    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const decoded = (req.server as any).jwt?.decode(token) as any;
        if (decoded?.id) return decoded.id;
      } catch {
        // ignora erro de decodificacao
      }
    }

    return (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
  }

  public create = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const organizadorId = this.extrairSolicitanteId(req);

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
      const usuarioAutenticadoId = this.extrairSolicitanteId(req);

      const partidas = await this.consultarMapaPartidasUseCase.execute({
        lat,
        lng,
        raioKm: radius,
        esporte: query.sport,
        endereco: typeof endereco === 'string' ? endereco : undefined,
        usuarioAutenticadoId,
        generoUsuario,
      });

      return reply.status(200).send({ data: partidas });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao consultar partidas: ' + err.message });
    }
  };

  public listMyMatches = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const organizadorId = this.extrairSolicitanteId(req);
      if (this.partidaRepo && typeof this.partidaRepo.listarPorOrganizador === 'function') {
        const partidas = await this.partidaRepo.listarPorOrganizador(organizadorId, true);
        return reply.status(200).send({ data: partidas });
      }
      return reply.status(200).send({ data: [] });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao consultar partidas do organizador: ' + err.message });
    }
  };

  public cancel = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const solicitanteId = this.extrairSolicitanteId(req);

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
      const solicitanteId = this.extrairSolicitanteId(req);

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
      const solicitanteId = this.extrairSolicitanteId(req);
      const motivo = (req.body as any)?.motivo || (req.query as any)?.motivo;

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
