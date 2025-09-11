// src/main/java/com/shinhan/backend/service/MemberService.java
package com.shinhan.backend.service.member;

import com.shinhan.backend.domain.Member;
import org.apache.ibatis.annotations.Param;

public interface MemberService {
    void join(Member m, String defaultRole);              // 회원가입 + 권한
    Member login(String memberId, String rawPassword);    // 로그인 검증
    void updateLastLogin(String memberId);                // 마지막 로그인 갱신
    boolean checkId(String memberId);             // 아이디 중복 체크
    boolean checkEmail(String memberEmail);
    void forgotPassword(String memberId, String memberEmail);
    void updatePassword(String memberId, String currentPwd, String newPwd);
    void deleteAccount(String memberId, String currentPwd);
}
