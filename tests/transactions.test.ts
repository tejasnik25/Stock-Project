import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readDatabase, writeDatabase, addWalletTransaction, updateTransactionStatus, getUserById } from '../src/db/dbService';

describe('transaction lifecycle', () => {
  let dbBackup: any;
  beforeEach(() => {
    const db = readDatabase();
    dbBackup = JSON.parse(JSON.stringify(db));
  });
  afterEach(() => {
    writeDatabase(dbBackup);
  });

  it('creates transaction and update status with history and credits user', async () => {
    const db = readDatabase();
    const user = db.users[0];
    expect(user).toBeDefined();
    const initialBalance = user.wallet_balance;
    const result = await addWalletTransaction(user.id, 10, 'deposit', 'manual', 'tx-123', undefined);
    expect(result.success).toBe(true);
    const txn = result.transaction!;
    // Approve transaction
    const updateRes = await updateTransactionStatus(txn.id, 'approved', 'admin123', 10, undefined);
    expect(updateRes.success).toBe(true);
    const updatedTxn = updateRes.transaction!;
    expect(updatedTxn.status).toBe('completed');
    expect(updatedTxn.history && updatedTxn.history.length).toBeGreaterThan(0);
    const updatedUser = (await getUserById(user.id)).user!;
    expect(updatedUser.wallet_balance).toBe(initialBalance + 10);
  });
});
