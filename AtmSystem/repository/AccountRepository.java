package AtmSystem.repository;

import AtmSystem.model.BankAccount;

public class AccountRepository {

    private BankAccount account = new BankAccount(1000);

    public BankAccount getAccount() {
        return account;
    }
}