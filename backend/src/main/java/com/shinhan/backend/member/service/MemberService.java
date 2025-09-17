// src/main/java/com/shinhan/backend/service/MemberService.java
package com.shinhan.backend.member.service;

import com.shinhan.backend.member.domain.Member;
import com.shinhan.backend.member.dto.LoginRequestDto;
import com.shinhan.backend.member.dto.LoginResponseDto;
import com.shinhan.backend.member.dto.SignupRequestDto;
import com.shinhan.backend.member.dto.SignupResponseDto;

public interface MemberService {
    SignupResponseDto join(SignupRequestDto req, String defaultRole);              // 회원가입 + 권한
    LoginResponseDto login(LoginRequestDto req);    // 로그인 검증
    void updateLastLogin(String memberId);                // 마지막 로그인 갱신
    boolean checkId(String memberId);             // 아이디 중복 체크
    boolean checkEmail(String memberEmail);
    void forgotPassword(String memberId, String memberEmail);
    void updatePassword(String memberId, String currentPwd, String newPwd);
    void deleteAccount(String memberId, String currentPwd);
}
