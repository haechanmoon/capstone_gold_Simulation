package com.shinhan.backend.member.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequestDto {
    private String memberId;
    private String memberPwd;
    private String memberName;
    private String memberEmail;
}