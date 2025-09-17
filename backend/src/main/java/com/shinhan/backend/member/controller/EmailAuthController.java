// src/main/java/com/shinhan/backend/member/controller/EmailAuthController.java
package com.shinhan.backend.member.controller;

import com.shinhan.backend.member.dto.SendEmailCodeRequestDto;
import com.shinhan.backend.member.dto.VerifyEmailCodeRequestDto;
import com.shinhan.backend.member.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class EmailAuthController {
    private final EmailVerificationService svc;

    @PostMapping("/send")
    public ResponseEntity<Map<String, Boolean>> send(@RequestBody SendEmailCodeRequestDto req){
        svc.sendCode(req.getMemberEmail());
        return ResponseEntity.ok(Map.of("ok", true)); // 프런트가 JSON 파싱
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Boolean>> verify(@RequestBody VerifyEmailCodeRequestDto req){
        boolean ok = svc.verifyCode(req.getMemberEmail(), req.getCode());
        return ok
                ? ResponseEntity.ok(Map.of("ok", true))
                : ResponseEntity.badRequest().body(Map.of("ok", false));
    }
}