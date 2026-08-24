package com.bankapp;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Shared base for Testcontainers-backed integration tests (see {@code *IT.java} classes, run by
 * maven-failsafe-plugin via {@code mvn verify}, not by {@code mvn test}). Spins up a real MySQL 8
 * container and points the Spring context's datasource + Flyway at it via
 * {@link DynamicPropertySource}, so every IT test exercises the real schema (Flyway migrations
 * V1-V6) rather than a mock or an in-memory substitute.
 *
 * <p>Requires a working Docker daemon. If Docker is unavailable, subclasses fail at container
 * startup — that is expected in environments without Docker access.
 */
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL_CONTAINER = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("bankapp_it")
            .withUsername("bankapp_it")
            .withPassword("bankapp_it_pw");

    @DynamicPropertySource
    static void registerMysqlProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL_CONTAINER::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL_CONTAINER::getUsername);
        registry.add("spring.datasource.password", MYSQL_CONTAINER::getPassword);
        registry.add("spring.flyway.url", MYSQL_CONTAINER::getJdbcUrl);
        registry.add("spring.flyway.user", MYSQL_CONTAINER::getUsername);
        registry.add("spring.flyway.password", MYSQL_CONTAINER::getPassword);
    }
}
