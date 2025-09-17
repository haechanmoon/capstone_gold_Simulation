package com.shinhan.backend.simulationHistory.controller;

import com.shinhan.backend.simulationHistory.dto.HistoryListDto;
import com.shinhan.backend.simulationHistory.dto.HistoryStatsDto;
import com.shinhan.backend.simulationHistory.dto.HistorySummaryDto;
import com.shinhan.backend.simulationHistory.service.SimulationHistoryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class SimulationHistoryController {

    private final SimulationHistoryService service;

    @GetMapping
    public HistoryListDto getHistory(
            @RequestParam(defaultValue = "2023-01-01") String from,
            @RequestParam(defaultValue = "2024-12-31") String to,
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "date,desc") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session
    ) {
        Object uno = session.getAttribute("LOGIN_NO");
        if (uno == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Long memberNo = Long.valueOf(uno.toString());

        return service.getHistory(
                memberNo,
                LocalDate.parse(from),
                LocalDate.parse(to),
                type,
                sort,
                page,
                size
        );
    }

    @GetMapping("/stats")
    public HistoryStatsDto getStats(@RequestParam String from,
                                    @RequestParam String to,
                                    @RequestParam(defaultValue = "") String type,
                                    HttpSession session) {
        Object uno = session.getAttribute("LOGIN_NO");
        if (uno == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Long memberNo = Long.valueOf(uno.toString());
        return service.getHistoryStats(memberNo, from, to, type);
    }

    @GetMapping("/summary")
    public HistorySummaryDto getSummary(HttpSession session) {
        Object uno = session.getAttribute("LOGIN_NO");
        if (uno == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Long memberNo = Long.valueOf(uno.toString());
        return service.getHistorySummary(memberNo);
    }
}
