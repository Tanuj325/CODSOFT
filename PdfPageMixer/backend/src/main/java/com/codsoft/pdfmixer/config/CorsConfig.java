package com.codsoft.pdfmixer.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.frontend-origin:}")
    private String frontendOrigin;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> allowedOrigins = new ArrayList<>();
        allowedOrigins.add("http://localhost:*");
        allowedOrigins.add("http://127.0.0.1:*");
        allowedOrigins.add("https://*.vercel.app");

        if (frontendOrigin != null && !frontendOrigin.isBlank()) {
            allowedOrigins.add(frontendOrigin.trim());
        }

        registry.addMapping("/api/**")
            .allowedOriginPatterns(allowedOrigins.toArray(String[]::new))
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(false);
    }
}
