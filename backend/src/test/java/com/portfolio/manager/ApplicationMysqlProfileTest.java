package com.portfolio.manager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("mysql")
class ApplicationMysqlProfileTest {

    @Test
    void contextLoadsWithMysqlProfile() {
    }
}
