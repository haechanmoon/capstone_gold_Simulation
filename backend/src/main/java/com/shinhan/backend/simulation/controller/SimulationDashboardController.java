package com.shinhan.backend.simulation.controller;

import com.shinhan.backend.simulation.dto.QuoteRowDto;
import com.shinhan.backend.simulation.service.SimulationDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/simulation")
public class SimulationDashboardController {

    private final SimulationDashboardService service;

    // 예: GET /api/simulation/quotes?to=2024-10-01&unit=1y
    //    GET /api/simulation/quotes?from=2024-06-01&to=2024-10-01
    @GetMapping("/quotes")
    public List<QuoteRowDto> quotes(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @RequestParam(defaultValue = "10y") String unit
    ){
        return service.getQuotes(to, unit, from);
    }
}