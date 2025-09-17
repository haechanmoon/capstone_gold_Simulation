package com.shinhan.backend.simulationHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HistoryStatsDto {
    private long total;
    private long correct;
    private long wrong;
    private long unsolved;
    private double accuracy; // (correct)/(correct+wrong)
}