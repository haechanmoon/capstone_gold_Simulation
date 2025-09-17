package com.shinhan.backend.simulationHistory.dto;

import com.shinhan.backend.simulationHistory.domain.SimulationHistory;
import lombok.Data;

@Data
public class SimulationHistoryDto {
    private Long id;
    private String date;
    private String type;
    private String answer;
    private String actual;
    private String result;   // "correct" | "wrong" | "unsolved"
    private Double pnl;
    private String note;

    public SimulationHistoryDto(SimulationHistory h) {
        this.id = h.getHistoryNo();
        this.date = h.getHistoryDate();
        this.type = h.getHistoryType();
        this.answer = h.getHistoryPredict();
        this.actual = h.getHistoryResult();
        this.result = h.getHistoryResult() == null
                ? "unsolved"
                : (h.getHistoryResult().equals(h.getHistoryPredict()) ? "correct" : "wrong");
        this.pnl = h.getPnl() == null ? null : h.getPnl().doubleValue();
        this.note = h.getNote();
    }


}