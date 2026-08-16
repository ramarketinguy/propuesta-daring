import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hashPassword } from '../functions/api/_lib/auth.ts';

const argument = process.argv.find((value) => value.startsWith('--password='));
let password = argument ? argument.slice('--password='.length) : '';

if (!password) {
  const prompt = readline.createInterface({ input, output });
  password = await prompt.question('Contraseña del administrador: ');
  prompt.close();
}

if (!password) throw new Error('La contraseña no puede estar vacía');
console.log(await hashPassword(password));
