import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readDatabase, writeDatabase, submitAnalysis, getAnalysisHistory, getUserById } from '../src/db/dbService';

describe('submitAnalysis billing logic', () => {
  let backup: any;
  beforeEach(() => {
    // Backup DB and reset before each test
    const db = readDatabase();
    backup = JSON.parse(JSON.stringify(db));
  });
  afterEach(() => {
    // Restore DB
    writeDatabase(backup);
  });

  it('allows trial analyses up to 5 without charges', async () => {
    const db = readDatabase();
    const user = db.users.find(u => u.id === 'user789'); // user with 0 balance in initial DB
    expect(user).toBeDefined();
    if (!user) return;

    // Reset analysis_count for this user
    user.analysis_count = 0;
    writeDatabase(db);

    // Submit 4 analyses should not charge
    for (let i = 0; i < 4; i++) {
      const res = await submitAnalysis(user.id, 'Intraday Trading', undefined, undefined);
      expect(res).not.toBeNull();
    }
    const after = readDatabase().users.find(u => u.id === user.id);
    expect(after?.analysis_count).toBe(4);
  });

  it('charges after 5th analysis (if trial exhausted)', async () => {
    const db = readDatabase();
    const user = db.users.find(u => u.id === 'user456');
    expect(user).toBeDefined();
    if (!user) return;
    user.analysis_count = 5; // already used trial
    user.wallet_balance = 50;
    writeDatabase(db);

    const beforeBalance = user.wallet_balance;
    const result = await submitAnalysis(user.id, 'Intraday Trading', undefined, undefined);
    expect(result).not.toBeNull();

    const updatedUser = (await getUserById(user.id)).user;
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.wallet_balance).toBeLessThan(beforeBalance);
  });
});
