package com.shinhan.backend.simulationHistory.service.impl;

import com.shinhan.backend.simulationHistory.domain.SimulationHistory;
import com.shinhan.backend.simulationHistory.dto.HistoryListDto;
import com.shinhan.backend.simulationHistory.dto.HistoryStatsDto;
import com.shinhan.backend.simulationHistory.dto.HistorySummaryDto;
import com.shinhan.backend.simulationHistory.dto.SimulationHistoryDto;
import com.shinhan.backend.simulationHistory.mapper.SimulationHistoryMapper;
import com.shinhan.backend.simulationHistory.service.SimulationHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SimulationHistoryServiceImpl implements SimulationHistoryService {
    private final SimulationHistoryMapper mapper;

    @Override
    public HistoryListDto getHistory(Long memberNo, LocalDate from, LocalDate to,
                                     String type, String sort, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), 100);
        int offset = (p - 1) * s;

        List<SimulationHistory> rows = mapper.selectHistory(memberNo, from, to, type, sort, offset, s);
        long total = mapper.countHistory(memberNo, from, to, type);

        List<SimulationHistoryDto> items = rows.stream()
                .map(SimulationHistoryDto::new)
                .toList();

        return new HistoryListDto(items, p, s, total);
    }

    @Override
    public HistoryStatsDto getHistoryStats(Long memberNo, String from, String to, String type) {
        Map<String,Object> p = new java.util.HashMap<>();
        p.put("memberNo", memberNo);
        p.put("from", from);
        p.put("to", to);
        p.put("type", type);

        Map<String,Object> m = mapper.selectHistoryStats(p); // mapper.xml: parameterType="map"

        long total   = ((Number)m.getOrDefault("total",0)).longValue();
        long correct = ((Number)m.getOrDefault("correct",0)).longValue();
        long wrong   = ((Number)m.getOrDefault("wrong",0)).longValue();
        long unsolved= ((Number)m.getOrDefault("unsolved",0)).longValue();
        double acc   = (correct + wrong) > 0 ? (double)correct / (correct + wrong) : 0.0;

        return new HistoryStatsDto(total, correct, wrong, unsolved, acc);
    }

    @Override
    public HistorySummaryDto getHistorySummary(Long memberNo) {
        Map<String,Object> s = mapper.selectHistorySummary(memberNo);

        long total   = ((Number)s.getOrDefault("total",0)).longValue();
        long correct = ((Number)s.getOrDefault("correct",0)).longValue();
        long wrong   = ((Number)s.getOrDefault("wrong",0)).longValue();
        long unsolved= total - correct - wrong;

        double totalPnl = ((Number)s.getOrDefault("totalPnl",0)).doubleValue();
        double avgPnl   = ((Number)s.getOrDefault("avgPnl",0)).doubleValue();
        double maxPnl   = ((Number)s.getOrDefault("maxPnl",0)).doubleValue();
        double minPnl   = ((Number)s.getOrDefault("minPnl",0)).doubleValue();

        double acc = (correct + wrong) > 0 ? (double)correct / (correct + wrong) : 0.0;

        return new HistorySummaryDto(total, correct, wrong, unsolved,
                totalPnl, avgPnl, maxPnl, minPnl, acc);
    }
}
