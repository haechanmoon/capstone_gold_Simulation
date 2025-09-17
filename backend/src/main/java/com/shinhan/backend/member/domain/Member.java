// src/main/java/com/shinhan/backend/domain/Member.java
package com.shinhan.backend.member.domain;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class Member {
    private int memberNo;         // 회원 고유 번호
    private String memberId;      // 아이디
    private String memberPwd;     // 비밀번호(BCrypt 암호화 저장)
    private String memberName;    // 이름
    private String memberEmail;   // 이메일
    private String memberRole;    // 권한
    private Date memberCreatedAt; // 가입일
    private Date memberUpdatedAt; // 수정일
    private Date memberLastLogin; // 마지막 로그인
    private int memberIsActive;   // 활성화 여부
    private Date memberDeletedAt;  // 회원삭제일


    // 권한 여러 개를 둘 수도 있으니 확장용 필드
    private List<MemberAuth> authList;
}
