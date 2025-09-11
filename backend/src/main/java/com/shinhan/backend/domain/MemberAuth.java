// src/main/java/com/shinhan/backend/domain/MemberAuth.java
package com.shinhan.backend.domain;

import lombok.Data;

@Data
public class MemberAuth {
    private Long no;         // PK
    private String memberId; // FK (회원 아이디)
    private String auth;     // 권한
}
