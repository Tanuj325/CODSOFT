package NumberGuessingGame;
import java.util.Random;
import java.util.Scanner;
public class NumberGuessingGame {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
        Random rand = new Random();

        int totalScore = 0;
        boolean playAgain = true;

        System.out.println("Welcome to Number Guessing Game!");

        while (playAgain) {

            int number = rand.nextInt(100) + 1;
            int attempts = 0;
            int maxAttempts = 10;
            boolean guessed = false;

            System.out.println("\nGuess the number between 1 and 100");
            System.out.println("Max attempts allowed: " + maxAttempts);

            while (true) {
                System.out.print("Enter your guess: ");
                int guess = sc.nextInt();
                attempts++;

                if (guess == number) {
                    System.out.println("Correct!");
                    guessed = true;

                    int score = (maxAttempts - attempts + 1) * 10;
                    if (score < 0)
                        score = 0;

                    totalScore += score;

                    System.out.println("Attempts taken: " + attempts);
                    System.out.println("Score this round: " + score);
                    break;
                } else if (guess < number) {
                    System.out.println("Too low!");
                } else {
                    System.out.println("Too high!");
                }

                if (attempts >= maxAttempts) {
                    System.out.println("You reached max attempts!");
                    System.out.println("Correct number was: " + number);
                    break;
                }
            }

            System.out.println("Total Score: " + totalScore);

            System.out.print("\nDo you want to play again? (yes/no): ");
            String choice = sc.next().toLowerCase();

            if (!choice.equals("yes")) {
                playAgain = false;
            }
        }

        System.out.println("\nGame Over! Final Score: " + totalScore);
        sc.close();
    }
}