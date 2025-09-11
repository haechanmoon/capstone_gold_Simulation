package com.shinhan.backend.service.member;

public interface EmailVerificationService {
    void sendCode(String email);
    boolean verifyCode(String email, String code);
}