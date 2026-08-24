# --- Build stage -----------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Cache dependencies separately from source so a source-only change doesn't
# force a full dependency re-download.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B clean package -DskipTests

# --- Run stage ---------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS run
WORKDIR /app

RUN addgroup -S bankapp && adduser -S bankapp -G bankapp
COPY --from=build /build/target/*.jar app.jar
RUN chown bankapp:bankapp app.jar
USER bankapp

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
