package AtmSystem.UI;

import javafx.application.Application;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import AtmSystem.repository.AccountRepository;
import AtmSystem.service.ATMService;

public class AtmApp extends Application {

    private ATMService service;

    @Override
    public void start(Stage stage) {

        AccountRepository repo = new AccountRepository();
        service = new ATMService(repo);

        Label title = new Label("🏦 ATM Machine");

        TextField amountField = new TextField();
        amountField.setPromptText("Enter amount");

        Label output = new Label();

        Button checkBtn = new Button("Check Balance");
        Button depositBtn = new Button("Deposit");
        Button withdrawBtn = new Button("Withdraw");

        checkBtn.setOnAction(e -> {
            output.setText(service.getBalance());
        });

        depositBtn.setOnAction(e -> {
            try {
                double amt = Double.parseDouble(amountField.getText());
                output.setText(service.deposit(amt));
                amountField.clear();
            } catch (Exception ex) {
                output.setText("Enter valid number!");
            }
        });

        withdrawBtn.setOnAction(e -> {
            try {
                double amt = Double.parseDouble(amountField.getText());
                output.setText(service.withdraw(amt));
                amountField.clear();
            } catch (Exception ex) {
                output.setText("Enter valid number!");
            }
        });

        VBox root = new VBox(10, title, amountField, checkBtn, depositBtn, withdrawBtn, output);
        root.setAlignment(Pos.CENTER);

        Scene scene = new Scene(root, 300, 300);

        stage.setTitle("ATM System");
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) {
        launch();
    }
}