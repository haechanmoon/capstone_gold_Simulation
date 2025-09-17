package com.shinhan.backend.simulation.service;

import com.shinhan.backend.simulation.dto.QuoteRowDto;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface SimulationDashboardService {
    List<QuoteRowDto> getQuotes(LocalDate to, String unit, LocalDate fromOpt);
}