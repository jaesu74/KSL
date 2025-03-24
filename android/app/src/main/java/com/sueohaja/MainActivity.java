package com.sueohaja;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputEditText;

public class MainActivity extends AppCompatActivity {
    private TextInputEditText etUsername;
    private TextInputEditText etPassword;
    private Button btnLogin;
    private Button btnSkip;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // UI 요소 초기화
        etUsername = findViewById(R.id.etUsername);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        btnSkip = findViewById(R.id.btnSkip);

        // 로그인 버튼 클릭 이벤트
        btnLogin.setOnClickListener(v -> {
            String username = etUsername.getText() != null ? etUsername.getText().toString() : "";
            String password = etPassword.getText() != null ? etPassword.getText().toString() : "";

            // 간단한 유효성 검사
            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "아이디와 비밀번호를 입력해주세요", Toast.LENGTH_SHORT).show();
                return;
            }

            // 로그인 로직은 여기에 구현
            Toast.makeText(this, username + "님 환영합니다", Toast.LENGTH_LONG).show();
            goToSignLanguageScreen();
        });

        // 게스트로 입장 버튼 클릭 이벤트
        btnSkip.setOnClickListener(v -> {
            Toast.makeText(this, "게스트로 입장합니다", Toast.LENGTH_LONG).show();
            goToSignLanguageScreen();
        });
    }

    private void goToSignLanguageScreen() {
        Intent intent = new Intent(this, SignLanguageActivity.class);
        startActivity(intent);
    }
} 