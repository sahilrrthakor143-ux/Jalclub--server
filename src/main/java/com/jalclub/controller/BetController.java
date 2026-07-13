package com.jalclub.controller;

import com.jalclub.dto.BetRequest;
import com.jalclub.dto.BetResponse;
import com.jalclub.model.Bet;
import com.jalclub.model.User;
import com.jalclub.service.BetService;
import com.jalclub.service.UserService;
import com.jalclub.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/bets")
@CrossOrigin(origins = "*")
public class BetController {
    
    @Autowired
    private BetService betService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtService jwtService;
    
    @PostMapping("/place")
    public ResponseEntity<?> placeBet(@RequestHeader("Authorization") String token,
                                       @Valid @RequestBody BetRequest request) {
        try {
            String tokenValue = token.replace("Bearer ", "");
            if (!jwtService.validateToken(tokenValue)) {
                throw new RuntimeException("Invalid token");
            }
            
            Long userId = jwtService.getUserIdFromToken(tokenValue);
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Bet bet = betService.placeBet(user, request.getBetAmount(), request.getSelectedColor());
            
            BetResponse response = new BetResponse();
            response.setBetId(bet.getId());
            response.setBetAmount(bet.getBetAmount());
            response.setSelectedColor(bet.getSelectedColor());
            response.setStatus(bet.getStatus());
            response.setCreatedAt(bet.getCreatedAt());
            response.setSuccess(true);
            response.setMessage("Bet placed successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            BetResponse response = new BetResponse();
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/{betId}/result")
    public ResponseEntity<?> getBetResult(@RequestHeader("Authorization") String token,
                                          @PathVariable Long betId) {
        try {
            String tokenValue = token.replace("Bearer ", "");
            if (!jwtService.validateToken(tokenValue)) {
                throw new RuntimeException("Invalid token");
            }
            
            Bet bet = betService.getBetById(betId);
            
            if (bet.getStatus().equals("PENDING")) {
                betService.declareResult(bet);
            }
            
            BetResponse response = new BetResponse();
            response.setBetId(bet.getId());
            response.setBetAmount(bet.getBetAmount());
            response.setSelectedColor(bet.getSelectedColor());
            response.setStatus(bet.getStatus());
            response.setResultColor(bet.getResultColor());
            response.setWinningAmount(bet.getWinningAmount());
            response.setResultTime(bet.getResultTime());
            response.setSuccess(true);
            response.setMessage("Result declared");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            BetResponse response = new BetResponse();
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<?> getBetHistory(@RequestHeader("Authorization") String token) {
        try {
            String tokenValue = token.replace("Bearer ", "");
            if (!jwtService.validateToken(tokenValue)) {
                throw new RuntimeException("Invalid token");
            }
            
            Long userId = jwtService.getUserIdFromToken(tokenValue);
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Bet> bets = betService.getBetHistory(user);
            return ResponseEntity.ok(bets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}