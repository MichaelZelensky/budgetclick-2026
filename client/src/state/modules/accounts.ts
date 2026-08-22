import type { Account } from "@/types/data/Account";
import { getState } from "@/state/state";

export const initializeAccounts = (accounts: Account[]): void => {
  getState().data.accounts = structuredClone(accounts);
};

export const addAccount = (account: Account): void => {
  getState().data.accounts.push(structuredClone(account));
};

export const updateAccountState = (account: Account): void => {
  const accounts = getState().data.accounts;
  const index = accounts.findIndex(x => x.id === account.id);
  if (index === -1) {
    throw new Error("Account not found");
  }
  accounts[index] = structuredClone(account);
};

export const removeAccountState = (accountId: string): void => {
  const accounts = getState().data.accounts;
  const index = accounts.findIndex(x => x.id === accountId);
  if (index === -1) {
    throw new Error("Account not found");
  }
  accounts.splice(index, 1);
};