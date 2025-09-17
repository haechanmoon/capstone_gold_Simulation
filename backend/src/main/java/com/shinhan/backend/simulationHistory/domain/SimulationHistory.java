package com.shinhan.backend.simulationHistory.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SimulationHistory {
    private Long historyNo;
    private Long memberNo;
    private String historyDate;
    private String historyType;
    private String historyPredict;  // 매수/매도
    private String historyResult;   // 실제값
    private Double pnl;             // 손익
    private Boolean favorite;       // 즐겨찾기
    private String tags;            // 태그
    private String note;            // 메모
    private LocalDateTime createdAt;
}