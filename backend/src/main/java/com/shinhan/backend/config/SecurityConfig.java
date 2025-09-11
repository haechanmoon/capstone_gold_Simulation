package com.shinhan.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})                  // 개발 중 CORS 허용(필요 시 CorsConfigurationSource 주입)
                .csrf(csrf -> csrf.disable())      // SPA + 세션 기반이면 CSRF 토큰 처리 대안 고려
                .formLogin(f -> f.disable())       // 기본 로그인 폼 비활성화
                .httpBasic(h -> h.disable())       // 기본 인증 팝업 비활성화
                .exceptionHandling(e ->
                        e.authenticationEntryPoint((req, res, ex) -> res.sendError(401))
                )
                .authorizeHttpRequests(auth -> auth
                        // React 정적 리소스 및 SPA 라우트(공개)
                        .requestMatchers(
                                "/", "/index.html", "/favicon.ico",
                                "/assets/**", "/static/**",
                                "/login", "/signup", "/forgotPassword",
                                "/simulation", "/history",
                                "/mypage", "/updatePassword", "/deleteAccount" // SPA 경로 자체는 공개(컴포넌트에서 보호)
                        ).permitAll()

                        // 인증/회원 관련 공개 API
                        .requestMatchers("/api/auth/**").permitAll()

                        // 그 밖의 모든 API는 인증 필요
                        .anyRequest().authenticated()
                )
                .logout(l -> l
                        .logoutUrl("/api/auth/logout")
                        .addLogoutHandler((req, res, auth) -> {
                            var session = req.getSession(false);
                            if (session != null) session.invalidate();
                        })
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200))
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
