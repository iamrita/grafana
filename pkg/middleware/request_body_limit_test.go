package middleware

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/setting"
)

func TestRequestBodyLimit(t *testing.T) {
	tests := []struct {
		name           string
		maxBytes       int64
		method         string
		contentType    string
		body           []byte
		wantStatusCode int
	}{
		{
			name:           "allows JSON body under limit",
			maxBytes:       16,
			method:         http.MethodPost,
			contentType:    "application/json",
			body:           []byte(`{"ok":true}`),
			wantStatusCode: http.StatusOK,
		},
		{
			name:           "rejects JSON body over limit",
			maxBytes:       8,
			method:         http.MethodPost,
			contentType:    "application/json",
			body:           []byte(`{"too":"large"}`),
			wantStatusCode: http.StatusRequestEntityTooLarge,
		},
		{
			name:           "does not limit multipart uploads",
			maxBytes:       8,
			method:         http.MethodPost,
			contentType:    "multipart/form-data; boundary=abc",
			body:           []byte("this body is much larger than eight bytes"),
			wantStatusCode: http.StatusOK,
		},
		{
			name:           "does not limit GET requests",
			maxBytes:       8,
			method:         http.MethodGet,
			contentType:    "application/json",
			body:           nil,
			wantStatusCode: http.StatusOK,
		},
		{
			name:           "disabled when max bytes is zero",
			maxBytes:       0,
			method:         http.MethodPost,
			contentType:    "application/json",
			body:           []byte(`{"disabled":true,"payload":"still allowed"}`),
			wantStatusCode: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := setting.NewCfg()
			cfg.MaxRequestBodyBytes = tt.maxBytes

			handler := RequestBodyLimit(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Body != nil {
					_, err := io.ReadAll(r.Body)
					if err != nil {
						return
					}
				}
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest(tt.method, "/api/test", bytes.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			require.Equal(t, tt.wantStatusCode, rec.Code)
		})
	}
}

func TestIsJSONContentType(t *testing.T) {
	tests := []struct {
		contentType string
		want        bool
	}{
		{contentType: "application/json", want: true},
		{contentType: "application/json; charset=utf-8", want: true},
		{contentType: "APPLICATION/JSON", want: true},
		{contentType: "text/plain", want: false},
		{contentType: "multipart/form-data; boundary=abc", want: false},
		{contentType: "", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.contentType, func(t *testing.T) {
			assert.Equal(t, tt.want, isJSONContentType(tt.contentType))
		})
	}
}
