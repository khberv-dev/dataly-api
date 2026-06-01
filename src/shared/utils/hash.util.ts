import * as bcrypt from 'bcryptjs';

export const hash = (value: string): Promise<string> => bcrypt.hash(value, 10);

export const compare = (value: string, hashed: string): Promise<boolean> => bcrypt.compare(value, hashed);
