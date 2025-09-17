package com.shinhan.backend.simulation.service.impl;

import com.shinhan.backend.simulation.dto.QuoteRowDto;
import com.shinhan.backend.simulation.mapper.QuotesMapper;
import com.shinhan.backend.simulation.service.SimulationDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SimulationDashboardServiceImpl implements SimulationDashboardService {

    private final QuotesMapper quotesMapper;

    private static final Map<String,Integer> UNIT_DAYS = Map.of(
            "10y",3650, "5y",1825, "1y",365, "3m",90, "1m",30, "1w",7
    );

    @Override
    public List<QuoteRowDto> getQuotes(LocalDate to, String unit, LocalDate fromOpt) {
        int days = UNIT_DAYS.getOrDefault(unit, 365);
        LocalDate from = (fromOpt != null) ? fromOpt : to.minusDays(days - 1);
        return quotesMapper.selectQuotes(from, to);
    }
}