package com.shinhan.backend.domain;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SimulationHistory {
    private Long historyNo;
    private Long memberNo;
    private LocalDate historyDate;
    private String historyPredict;
    private String historyResult;
    private BigDecimal pnl;
    private Integer favorite;   // 0/1
    private String tags;
    private String note;
    private LocalDateTime createdAt;
}
