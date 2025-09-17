package com.shinhan.backend.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDto {
    private int memberNo;
    private String memberId;
    private String memberName;
    private String memberEmail;
    private String memberRole;
}