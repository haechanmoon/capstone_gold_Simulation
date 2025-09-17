package com.shinhan.backend.member.service;

public interface EmailVerificationService {
    void sendCode(String email);
    boolean verifyCode(String email, String code);
}