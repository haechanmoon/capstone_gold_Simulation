package com.shinhan.backend.controller.member;

import com.shinhan.backend.service.member.EmailVerificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class EmailAuthController {
    private final EmailVerificationService svc;

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody EmailReq req){
        svc.sendCode(req.getEmail()); return ResponseEntity.ok(new Ok(true));
    }
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyReq req){
        boolean ok = svc.verifyCode(req.getEmail(), req.getCode());
        return ok ? ResponseEntity.ok(new Ok(true)) : ResponseEntity.badRequest().body(new Ok(false));
    }

    @Data
    static class EmailReq { private String email; }
    @Data static class VerifyReq { private String email; private String code; }
    @Data static class Ok { private final boolean ok; }
}