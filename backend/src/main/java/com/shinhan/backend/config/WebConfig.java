// com.shinhan.backend.config.WebConfig
package com.shinhan.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry r) {
        // React SPA 진입점으로 포워딩할 경로들
        r.addViewController("/").setViewName("forward:/index.html");
        r.addViewController("/login").setViewName("forward:/index.html");
        r.addViewController("/signup").setViewName("forward:/index.html");
        r.addViewController("/forgotPassword").setViewName("forward:/index.html");
        r.addViewController("/updatePassword").setViewName("forward:/index.html");
        r.addViewController("/deleteAccount").setViewName("forward:/index.html");

        // 시뮬레이션 대시보드 및 학습 이력
        r.addViewController("/simulation").setViewName("forward:/index.html");
        r.addViewController("/history").setViewName("forward:/index.html");
    }
}
