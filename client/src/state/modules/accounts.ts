import type { Account } from "@/types/data/Account";
import { getState } from "@/state/state";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";

export const initializeAccounts = (accountsStorage: AccountsStorage): void => {
  getState().data.accounts = structuredClone(accountsStorage);
};

export const addAccount = (account: Account): void => {
  const accountsStorage = getState().data.accounts;
  if (accountsStorage === null) {
    throw new Error("Accounts have not been initialized");
  }
  accountsStorage.accounts.push(structuredClone(account));
};

export const updateAccountState = (account: Account): void => {
  const accountsStorage = getState().data.accounts;
  if (accountsStorage === null) {
    throw new Error("Accounts have not been initialized");
  }
  const index = accountsStorage.accounts.findIndex(x => x.id === account.id);
  if (index === -1) {
    throw new Error("Account not found");
  }
  accountsStorage.accounts[index] = structuredClone(account);
};

export const removeAccountState = (accountId: string): void => {
  const accountsStorage = getState().data.accounts;
  if (accountsStorage === null) {
    throw new Error("Accounts have not been initialized");
  }
  const index = accountsStorage.accounts.findIndex(x => x.id === accountId);
  if (index === -1) {
    throw new Error("Account not found");
  }
  accountsStorage.accounts.splice(index, 1);
};