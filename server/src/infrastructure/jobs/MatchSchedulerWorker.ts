import { IPartidaRepository } from '../../application/repositories/IRepositories';
import { FinalizarPartidaUseCase } from '../../application/use-cases/FinalizarPartidaUseCase';

export class MatchSchedulerWorker {
  private timer: NodeJS.Timeout | null = null;
  private executando = false;
  private readonly intervaloMs: number;

  constructor(
    private partidaRepo: IPartidaRepository,
    private finalizarPartidaUseCase: FinalizarPartidaUseCase,
    intervaloMs = 60000 // 1 minuto
  ) {
    this.intervaloMs = intervaloMs;
  }

  public start(): void {
    if (this.timer) return;
    console.log(`⏱️  MatchSchedulerWorker iniciado. Verificação a cada ${this.intervaloMs / 1000}s.`);
    
    // Executa a primeira checagem imediatamente
    this.processarPartidasExpiradas();

    this.timer = setInterval(() => {
      this.processarPartidasExpiradas();
    }, this.intervaloMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('⏱️  MatchSchedulerWorker finalizado.');
    }
  }

  public async processarPartidasExpiradas(): Promise<number> {
    if (this.executando) return 0;
    this.executando = true;

    try {
      const agora = new Date();
      const partidasExpiradas = await this.partidaRepo.buscarPartidasExpiradas(agora);

      if (partidasExpiradas.length > 0) {
        console.log(`🔄 MatchSchedulerWorker: Encontradas ${partidasExpiradas.length} partida(s) expirada(s) para finalização automática.`);
      }

      for (const partida of partidasExpiradas) {
        try {
          await this.finalizarPartidaUseCase.execute({ partidaId: partida.id });
          console.log(`✅ Partida [${partida.id}] (${partida.esporte}) finalizada automaticamente pelo Scheduler.`);
        } catch (err: any) {
          console.warn(`⚠️ Erro ao finalizar partida [${partida.id}] via Scheduler:`, err.message);
        }
      }

      return partidasExpiradas.length;
    } catch (err: any) {
      console.error('❌ Erro no ciclo do MatchSchedulerWorker:', err.message);
      return 0;
    } finally {
      this.executando = false;
    }
  }
}
