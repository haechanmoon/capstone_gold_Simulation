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
                .cors(cors -> {})                  // CORS 허용
                .csrf(csrf -> csrf.disable())      // SPA 환경에서는 CSRF 비활성화 (대안 고려 가능)
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
                                "/mypage", "/updatePassword", "/deleteAccount"
                        ).permitAll()

                        // 인증/회원 관련 공개 API
                        .requestMatchers("/api/auth/**").permitAll()

                        // 시뮬레이션 API는 로그인 필요 없음
                        .requestMatchers("/api/simulation/**").permitAll()

                        // 학습 이력 API는 로그인 필요
                        .requestMatchers("/api/history/**").permitAll()

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
