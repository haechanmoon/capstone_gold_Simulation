// src/main/java/com/shinhan/backend/service/impl/MemberServiceImpl.java
package com.shinhan.backend.service.member.impl;

import com.shinhan.backend.domain.Member;
import com.shinhan.backend.domain.MemberAuth;
import com.shinhan.backend.mapper.MemberMapper;
import com.shinhan.backend.service.member.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {
    private final MemberMapper memberMapper;
    private final PasswordEncoder encoder;
    private final JavaMailSender mailSender;

    @Transactional
    @Override
    public void join(Member m, String defaultRole) {
        m.setMemberPwd(encoder.encode(m.getMemberPwd()));
        memberMapper.insertMember(m);

        MemberAuth a = new MemberAuth();
        a.setMemberId(m.getMemberId());
        a.setAuth(defaultRole != null ? defaultRole : "ROLE_USER");
        memberMapper.insertAuth(a);
    }

    @Override
    public Member login(String memberId, String rawPassword) {
        String hashed = memberMapper.findPasswordById(memberId);
        if (hashed != null && encoder.matches(rawPassword, hashed)) {
            return memberMapper.findById(memberId);
        }
        return null;
    }

    @Override
    public void updateLastLogin(String memberId) {
        memberMapper.updateLastLogin(memberId);
    }

    @Override
    public boolean checkId(String memberId) {
        return memberMapper.checkId(memberId) > 0;

    }

    @Override
    public boolean checkEmail(String memberEmail) {
        return memberMapper.checkEmail(memberEmail) > 0;
    }

    @Override
    @Transactional
    public void forgotPassword(String memberId, String memberEmail) {
        String tempPassword = generatePassword(12);
        String encodedPassword = encoder.encode(tempPassword);

        int updated = memberMapper.forgotPassword(memberId, memberEmail, encodedPassword);
        if(updated == 0) {
            throw new IllegalArgumentException("아이디 또는 이메일 불일치");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(memberEmail);
        message.setSubject("임시 비밀번호 안내");
        message.setText("임시 비밀번호 : %s , 로그인 후 반드시 비밀번호를 변경하세요.".formatted(tempPassword));
        mailSender.send(message);
    }

    @Override
    @Transactional
    public void updatePassword(String memberId, String currentPwd, String newPwd) {
        String oldHash = memberMapper.selectPassword(memberId);
        if (oldHash == null || !encoder.matches(currentPwd, oldHash))
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");

        String newHash = encoder.encode(newPwd);
        int rows = memberMapper.updatePassword(memberId, oldHash, newHash);
        if (rows == 0) throw new IllegalStateException("비밀번호가 변경되었습니다. 다시 시도하세요.");
    }

    @Override
    @Transactional
    public void deleteAccount(String memberId, String currentPwd) {
        String storedHash = memberMapper.selectPassword(memberId);            // 해시 조회
        if (storedHash == null || !encoder.matches(currentPwd, storedHash)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        int rows = memberMapper.deleteMember(memberId, storedHash);           // 해시를 그대로 전달
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


