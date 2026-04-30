package AtmSystem.service;

import AtmSystem.repository.AccountRepository;

public class ATMService {

    private ATM atm;

    public ATMService(AccountRepository repo) {
        this.atm = new ATM(repo.getAccount());
    }

    public String getBalance() {
        return atm.checkBalance();
    }

    public String deposit(double amount) {
        return atm.deposit(amount);
    }

    public String withdraw(double amount) {
        return atm.withdraw(amount);
    }
}