# Build stage
FROM maven:3.9-jdk-17 AS builder

WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -DskipTests

COPY src src
RUN mvn -DskipTests package

# Runtime stage
FROM openjdk:17-jre

WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xmx512m"

ENTRYPOINT ["java", "-jar", "app.jar"]
