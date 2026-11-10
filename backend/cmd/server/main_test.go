package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireAPIToken(t *testing.T) {
	tests := []struct {
		name          string
		authorization string
		wantStatus    int
		wantNext      bool
	}{
		{name: "missing token", wantStatus: http.StatusUnauthorized},
		{name: "invalid token", authorization: "Bearer wrong", wantStatus: http.StatusUnauthorized},
		{name: "valid token", authorization: "Bearer test-token", wantStatus: http.StatusNoContent, wantNext: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			nextCalled := false
			handler := requireAPIToken("test-token", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				nextCalled = true
				w.WriteHeader(http.StatusNoContent)
			}))

			request := httptest.NewRequest(http.MethodGet, "/api/v1/courses", nil)
			request.Header.Set("Authorization", test.authorization)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
			if nextCalled != test.wantNext {
				t.Fatalf("next called = %t, want %t", nextCalled, test.wantNext)
			}
		})
	}
}
