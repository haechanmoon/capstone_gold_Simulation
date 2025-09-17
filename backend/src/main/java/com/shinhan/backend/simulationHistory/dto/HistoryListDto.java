package com.shinhan.backend.simulationHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class HistoryListDto {
    private List<SimulationHistoryDto> items;
    private int page;
    private int size;
    private long total;
}