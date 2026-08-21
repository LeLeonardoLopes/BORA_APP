import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../application/repositories/IRepositories';

export class BcryptPasswordHasher implements IPasswordHasher {
  private saltRounds: number;

  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  public async hash(plainText: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(plainText, salt);
  }

  public async compare(plainText: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hashed);
  }
}
