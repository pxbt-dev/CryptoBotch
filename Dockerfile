FROM node:22-slim AS frontend
WORKDIR /ui
COPY ui/package*.json ./
RUN npm ci --quiet
COPY ui/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src src
COPY --from=frontend /ui/dist src/main/resources/static
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
