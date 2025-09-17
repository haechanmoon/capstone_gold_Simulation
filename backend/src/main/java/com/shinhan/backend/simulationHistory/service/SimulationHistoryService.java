package com.shinhan.backend.simulationHistory.service;

import com.shinhan.backend.simulationHistory.dto.HistoryListDto;
import com.shinhan.backend.simulationHistory.dto.HistoryStatsDto;
import com.shinhan.backend.simulationHistory.dto.HistorySummaryDto;

import java.time.LocalDate;
import java.util.Map;

public interface SimulationHistoryService {
    HistoryListDto getHistory(Long memberNo, LocalDate from, LocalDate to,
                              String type, String sort, int page, int size);

    HistoryStatsDto getHistoryStats(Long memberNo, String from, String to, String type);

    HistorySummaryDto getHistorySummary(Long memberNo);
}
