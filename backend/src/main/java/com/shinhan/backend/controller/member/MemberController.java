// src/main/java/com/shinhan/backend/controller/member/MemberController.java
package com.shinhan.backend.controller.member;

import com.shinhan.backend.domain.Member;
import com.shinhan.backend.service.member.MemberService;
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

    private final MemberService memberService;

    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody Member req) {
        memberService.join(req, "ROLE_USER");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Member req, HttpSession session) {
        Member me = memberService.login(req.getMemberId(), req.getMemberPwd());
        if (me == null) return ResponseEntity.status(401).body("INVALID_CREDENTIALS");

        session.setAttribute(LOGIN_ID, me.getMemberId());   // 세션에 로그인 ID 저장
        memberService.updateLastLogin(me.getMemberId());

        // 프런트 일관성: 최소 정보만 반환
        return ResponseEntity.ok(Map.of("memberId", me.getMemberId()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        if (session != null) session.invalidate();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object uid = session.getAttribute(LOGIN_ID);
        if (uid == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("memberId", uid.toString()));
    }

    @GetMapping("/check-id")
    public Map<String, Integer> checkId(String memberId) {
        boolean exists = memberService.checkId(memberId);
        return Map.of("exists", exists ? 1 : 0);

    }

    @GetMapping("/check-email")
    public Map<String, Integer> checkEmail(String memberEmail) {
        boolean exists = memberService.checkEmail(memberEmail);
        return Map.of("exists", exists ? 1 : 0);
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String memberId = body.get("memberId");
            String email = body.get("email");
            memberService.forgotPassword(memberId, email);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "ok", false,
                    "message", "서버 오류"
            ));
        }
    }

    @PostMapping("/updatePassword")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String,String> body, HttpSession session) {
        Object uid = session.getAttribute(LOGIN_ID);
        if (uid == null) return ResponseEntity.status(401).body(Map.of("ok", false, "message", "로그인이 필요합니다."));

        String currentPwd = body.get("currentPwd");
        String newPwd     = body.get("newPwd");
        String confirmPwd = body.get("confirmPwd");
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
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String,String> body,
                                           HttpSession session) {
        Object uid = session.getAttribute("LOGIN_ID");
        if (uid == null) return ResponseEntity.status(401).build();
        memberService.deleteAccount(uid.toString(), body.get("password"));
        session.invalidate();
        return ResponseEntity.noContent().build();
    }



}
