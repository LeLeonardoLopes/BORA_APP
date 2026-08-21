import { db } from '../database/connection';
import { ICodigoVerificacaoRepository } from '../../application/repositories/IRepositories';

export class PgCodigoVerificacaoRepository implements ICodigoVerificacaoRepository {
  private memoriaFallback = new Map<string, { codigo: string; expiraEm: Date }>();

  public async salvarCodigo(email: string, codigo: string, expiraEm: Date): Promise<void> {
    const emailSanitizado = email.trim().toLowerCase();
    try {
      // Invalida códigos anteriores não utilizados
      await db.query(
        'UPDATE codigo_verificacao_email SET utilizado = TRUE WHERE LOWER(email) = $1 AND utilizado = FALSE',
        [emailSanitizado]
      );

      // Insere o novo código
      await db.query(
        'INSERT INTO codigo_verificacao_email (email, codigo, expira_em) VALUES ($1, $2, $3)',
        [emailSanitizado, codigo, expiraEm]
      );
    } catch (err: any) {
      console.warn('PostgreSQL inacessível para salvar código OTP. Usando memória:', err.message);
    }
    this.memoriaFallback.set(emailSanitizado, { codigo, expiraEm });
  }

  public async buscarCodigoValido(email: string, codigo: string): Promise<boolean> {
    const emailSanitizado = email.trim().toLowerCase();
    try {
      const res = await db.query(
        'SELECT * FROM codigo_verificacao_email WHERE LOWER(email) = $1 AND codigo = $2 AND expira_em > NOW() AND utilizado = FALSE',
        [emailSanitizado, codigo]
      );
      if (res.rows.length > 0) return true;
    } catch (err: any) {
      console.warn('Falha ao verificar código no PostgreSQL. Verificando memória:', err.message);
    }

    const reg = this.memoriaFallback.get(emailSanitizado);
    if (reg && reg.codigo === codigo && reg.expiraEm > new Date()) {
      return true;
    }
    return false;
  }

  public async consumirCodigo(email: string, codigo: string): Promise<void> {
    const emailSanitizado = email.trim().toLowerCase();
    try {
      await db.query(
        'UPDATE codigo_verificacao_email SET utilizado = TRUE WHERE LOWER(email) = $1 AND codigo = $2',
        [emailSanitizado, codigo]
      );
    } catch (err: any) {
      console.warn('Falha ao marcar código como utilizado no PostgreSQL:', err.message);
    }
    this.memoriaFallback.delete(emailSanitizado);
  }
}
