// src/main/java/com/shinhan/backend/service/impl/MemberServiceImpl.java
package com.shinhan.backend.member.service.impl;

import com.shinhan.backend.member.domain.Member;
import com.shinhan.backend.member.domain.MemberAuth;
import com.shinhan.backend.member.dto.LoginRequestDto;
import com.shinhan.backend.member.dto.LoginResponseDto;
import com.shinhan.backend.member.dto.SignupRequestDto;
import com.shinhan.backend.member.dto.SignupResponseDto;
import com.shinhan.backend.member.mapper.MemberMapper;
import com.shinhan.backend.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {
    private final MemberMapper memberMapper;
    private final PasswordEncoder encoder;
    private final JavaMailSender mailSender;

    @Override
    @Transactional
    public SignupResponseDto join(SignupRequestDto req, String defaultRole) {
        if (memberMapper.checkId(req.getMemberId()) > 0)  throw new IllegalArgumentException("DUPLICATE_ID");
        if (memberMapper.checkEmail(req.getMemberEmail()) > 0) throw new IllegalArgumentException("DUPLICATE_EMAIL");

        Member m = new Member();
        m.setMemberId(req.getMemberId());
        m.setMemberPwd(encoder.encode(req.getMemberPwd()));
        m.setMemberName(req.getMemberName());
        m.setMemberEmail(req.getMemberEmail());
        m.setMemberRole(defaultRole != null ? defaultRole : "ROLE_USER");

        memberMapper.insertMember(m); // memberNo 자동 생성
        MemberAuth a = new MemberAuth();
        a.setMemberId(m.getMemberId());
        a.setAuth(m.getMemberRole());
        memberMapper.insertAuth(a);

        return new SignupResponseDto(
                m.getMemberNo(), m.getMemberId(), m.getMemberName(), m.getMemberEmail(), m.getMemberRole()
        );
    }

    @Override
    public LoginResponseDto login(LoginRequestDto req) {
        Member member = memberMapper.findById(req.getMemberId());
        if (member == null) {
            throw new RuntimeException("존재하지 않는 사용자");
        }

        if (!encoder.matches(req.getMemberPwd(), member.getMemberPwd())) {
            throw new RuntimeException("비밀번호 불일치");
        }

        return new LoginResponseDto(
                member.getMemberNo(),
                member.getMemberId(),
                member.getMemberName(),
                member.getMemberEmail(),
                member.getMemberRole()
        );
    }

    @Override
    public void updateLastLogin(String memberId) {
        memberMapper.updateLastLogin(memberId);
    }

    @Override
    public boolean checkId(String memberId) {
        if (memberId == null || memberId.isBlank()) return true;
        memberId = memberId.trim();
        return memberMapper.checkId(memberId) > 0;
    }

    @Override
    public boolean checkEmail(String memberEmail) {
        if (memberEmail == null || memberEmail.isBlank()) return true;
        memberEmail = memberEmail.trim();
        return memberMapper.checkEmail(memberEmail) > 0;
    }

    @Override
    @Transactional
    public void forgotPassword(String memberId, String memberEmail) {
        if (memberId == null || memberId.isBlank() || memberEmail == null || memberEmail.isBlank()) {
            throw new IllegalArgumentException("아이디 또는 이메일 불일치");
        }
        final String id = memberId.trim();
        final String email = memberEmail.trim().toLowerCase(java.util.Locale.ROOT);

        String tempPassword    = generatePassword(12);
        String encodedPassword = encoder.encode(tempPassword);

        int updated = memberMapper.forgotPassword(id, email, encodedPassword);
        if (updated == 0) throw new IllegalArgumentException("아이디 또는 이메일 불일치");

        var msg = new org.springframework.mail.SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("임시 비밀번호 안내");
        msg.setText("임시 비밀번호: " + tempPassword + "\n로그인 후 반드시 비밀번호를 변경하세요.");
        mailSender.send(msg);
    }


    @Override
    @Transactional
    public void updatePassword(String memberId, String currentPwd, String newPwd) {
        if (memberId == null || currentPwd == null || newPwd == null
                || memberId.isBlank() || currentPwd.isBlank() || newPwd.isBlank()) {
            throw new IllegalArgumentException("입력값을 확인하세요.");
        }

        String id = memberId.trim();
        String oldHash = memberMapper.selectPassword(id);
        if (oldHash == null || !encoder.matches(currentPwd, oldHash)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        if (encoder.matches(newPwd, oldHash)) {
            throw new IllegalArgumentException("이전과 동일한 비밀번호는 사용할 수 없습니다.");
        }

        String newHash = encoder.encode(newPwd);
        int rows = memberMapper.updatePassword(id, oldHash, newHash);
        if (rows == 0) throw new IllegalStateException("비밀번호가 변경되었습니다. 다시 시도하세요.");
    }


    @Override
    @Transactional
    public void deleteAccount(String memberId, String currentPwd) {
        if (memberId == null || currentPwd == null || memberId.isBlank() || currentPwd.isBlank()) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        String id = memberId.trim();

        String storedHash = memberMapper.selectPassword(id);
        if (storedHash == null || !encoder.matches(currentPwd, storedHash)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        int rows = memberMapper.deleteMember(id, storedHash); // 동시성 보호
        if (rows == 0) throw new IllegalStateException("처리 대상이 없습니다.");
    }


    private String generatePassword(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*?";
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }


}


