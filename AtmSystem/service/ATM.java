package AtmSystem.service;

import AtmSystem.model.BankAccount;

public class ATM {

    private BankAccount account;

    public ATM(BankAccount account) {
        this.account = account;
    }

    public String checkBalance() {
        return "Balance: ₹" + account.getBalance();
    }

    public String deposit(double amount) {
        if (amount <= 0) return "Invalid amount!";
        account.deposit(amount);
        return "Deposit successful!";
    }

    public String withdraw(double amount) {
        if (amount <= 0) return "Invalid amount!";
        
        if (account.withdraw(amount)) {
            return "Withdrawal successful!";
        } else {
            return "Insufficient balance!";
        }
    }
}