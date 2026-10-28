import { FastifyRequest, FastifyReply } from 'fastify';
import { ListarUsuariosUseCase } from '../../application/use-cases/ListarUsuariosUseCase';
import { AtualizarPerfilUseCase } from '../../application/use-cases/AtualizarPerfilUseCase';
import { AlterarSenhaUseCase } from '../../application/use-cases/AlterarSenhaUseCase';

export class UsuarioController {
  constructor(
    private listarUsuariosUseCase: ListarUsuariosUseCase,
    private atualizarPerfilUseCase: AtualizarPerfilUseCase,
    private alterarSenhaUseCase?: AlterarSenhaUseCase
  ) {}

  public changePassword = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = (req.body as any) || {};
      if (!this.alterarSenhaUseCase) {
        return reply.status(503).send({ error: 'Alteração de senha indisponível.' });
      }
      await this.alterarSenhaUseCase.execute({
        usuarioId: body.usuarioId || (req.user as any)?.id,
        senhaAtual: body.senhaAtual,
        novaSenha: body.novaSenha,
      });
      return reply.status(200).send({ message: 'Senha alterada com sucesso.' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Não foi possível alterar a senha.' });
    }
  };

  public listAll = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const usuarios = await this.listarUsuariosUseCase.execute();
      return reply.status(200).send({
        data: usuarios.map((u) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          fotoUrl: u.fotoUrl,
          genero: u.genero,
          raioBuscaKm: u.raioBuscaKm,
          modalidadesFavoritas: u.modalidadesFavoritas,
          notaMedia: u.notaMedia,
          totalAvaliacoes: u.totalAvaliacoes,
          statusUsuario: u.statusUsuario,
        })),
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar usuários: ' + err.message });
    }
  };

  public updateProfile = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const userId = body.id || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';

      const usuarioAtualizado = await this.atualizarPerfilUseCase.execute({
        id: userId,
        email: body.email,
        nome: body.nome,
        fotoUrl: body.fotoUrl,
        raioBuscaKm: body.raioBuscaKm,
        modalidadesFavoritas: body.modalidadesFavoritas,
        meuTime: body.meuTime,
      });

      return reply.status(200).send({
        message: 'Perfil sincronizado com sucesso no banco de dados!',
        usuario: {
          id: usuarioAtualizado.id,
          nome: usuarioAtualizado.nome,
          email: usuarioAtualizado.email,
          genero: usuarioAtualizado.genero,
          raioBuscaKm: usuarioAtualizado.raioBuscaKm,
          modalidadesFavoritas: usuarioAtualizado.modalidadesFavoritas,
          fotoUrl: usuarioAtualizado.fotoUrl,
          notaMedia: usuarioAtualizado.notaMedia,
          meuTime: body.meuTime || null,
        },
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao sincronizar perfil com o banco: ' + err.message });
    }
  };
}
