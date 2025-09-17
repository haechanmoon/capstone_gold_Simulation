package com.shinhan.backend.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ExistsResponseDto {
    private int exists;
    public static ExistsResponseDto of(boolean b) {
        return new ExistsResponseDto(b ? 1 : 0);
    }
}