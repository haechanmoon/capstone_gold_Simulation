package com.shinhan.backend.simulationHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HistorySummaryDto {
    private long total, correct, wrong, unsolved;
    private double totalPnl, avgPnl, maxPnl, minPnl, accuracy;
}