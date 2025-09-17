// src/main/java/com/shinhan/backend/controller/member/MemberController.java
package com.shinhan.backend.member.controller;

import com.shinhan.backend.member.dto.*;
import com.shinhan.backend.member.service.MemberService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class MemberController {

    private static final String LOGIN_ID = "LOGIN_ID";
    private static final String LOGIN_NO = "LOGIN_NO";


    private final MemberService memberService;

    @PostMapping("/join")
    public ResponseEntity<SignupResponseDto> join(@RequestBody SignupRequestDto req) {
        SignupResponseDto dto = memberService.join(req, "ROLE_USER");
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto req, HttpSession session) {
        LoginResponseDto dto = memberService.login(req);

        // 세션 저장
        session.setAttribute(LOGIN_ID, dto.getMemberId());
        session.setAttribute(LOGIN_NO, dto.getMemberNo());

        memberService.updateLastLogin(dto.getMemberId());

        // 프런트 응답은 DTO 그대로
        return ResponseEntity.ok(dto);
    }


    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        if (session != null) session.invalidate();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object uid = session.getAttribute(LOGIN_ID);
        Object uno = session.getAttribute(LOGIN_NO);
        if (uid == null || uno == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(Map.of(
                "memberId", uid.toString(),
                "memberNo", Long.valueOf(uno.toString())
        ));
    }

    @GetMapping("/check-id")
    public ResponseEntity<ExistsResponseDto> checkId(@RequestParam String memberId) {
        return ResponseEntity.ok(ExistsResponseDto.of(memberService.checkId(memberId)));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ExistsResponseDto> checkEmail(@RequestParam String memberEmail) {
        return ResponseEntity.ok(ExistsResponseDto.of(memberService.checkEmail(memberEmail)));
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDto body) {
        try {
            memberService.forgotPassword(body.getMemberId(), body.getMemberEmail());
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "message", "서버 오류"));
        }
    }

    @PostMapping("/updatePassword")
    public ResponseEntity<?> updatePassword(@RequestBody UpdatePasswordRequestDto body, HttpSession session) {
        Object uid = session.getAttribute(LOGIN_ID);
        if (uid == null) return ResponseEntity.status(401).body(Map.of("ok", false, "message", "로그인이 필요합니다."));

        String currentPwd = body.getCurrentPwd();
        String newPwd     = body.getNewPwd();
        String confirmPwd = body.getConfirmPwd();

        if (newPwd == null || !newPwd.equals(confirmPwd)) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "새 비밀번호가 일치하지 않습니다."));
        }

        try {
            memberService.updatePassword(uid.toString(), currentPwd, newPwd);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "message", "서버 오류"));
        }
    }


    @PostMapping("/deleteAccount")
    public ResponseEntity<?> deleteAccount(@RequestBody DeleteAccountRequestDto body, HttpSession session) {
        Object uid = session.getAttribute(LOGIN_ID);
        if (uid == null) return ResponseEntity.status(401).build();

        try {
            memberService.deleteAccount(uid.toString(), body.getPassword());
            session.invalidate();
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "message", "서버 오류"));
        }
    }




}
