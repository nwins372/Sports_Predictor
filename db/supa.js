// index.js
import 'dotenv/config';
import { Client as PGClient } from 'pg';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';



// simple password prompt (note: input is visible; if you want masking, use a library)
async function promptPassword(promptText = 'ENTER THE PASSWORD NOW: ') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q) => new Promise((resolve) => rl.question(q, resolve));
  const answer = await question(promptText);
  rl.close();
  return answer;
}

async function main() {
  try {
    const USER = process.env.user;   // matches your Python env variable names
    const HOST = process.env.host;
    const PORT = process.env.port;
    const DBNAME = process.env.dbname;
    const PASSWORD = await promptPassword('ENTER THE PASSWORD NOW: ');

    if (!USER || !HOST || !PORT || !DBNAME) {
      throw new Error('Missing required Postgres env vars: user, host, port, dbname');
    }

    const pg = new PGClient({
      user: USER,
      host: HOST,
      port: Number(PORT),
      database: DBNAME,
      password: PASSWORD,
    });

    await pg.connect();
    console.log('Connection successful!');

    // Close the PG connection (mirrors your Python)
    await pg.end();

    // Then read via Supabase SDK like your read_sample_table()
    await readSampleTable();

  } catch (e) {
    console.error(`Issue: ${e.message || e}`);
  }
}

async function readSampleTable() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY are required in .env');
  }

  const supabase = createClient(url, key);
  console.log('READING FROM SAMPLE DATA TABLE:');

  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Supabase read error:', error.message);
  } else {
    console.log(data);
  }
}

console.log('Setup and Demo of Environment:\n');
main();
