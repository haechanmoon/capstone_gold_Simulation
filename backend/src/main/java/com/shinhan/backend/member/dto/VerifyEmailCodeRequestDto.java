package com.shinhan.backend.member.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class VerifyEmailCodeRequestDto {
    @JsonAlias({"email","memberEmail"})
    private String memberEmail;
    private String code;
}