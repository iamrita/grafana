package middleware

import (
	"bytes"
	"errors"
	"io"
	"mime"
	"net/http"
	"strings"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

// RequestBodyLimit enforces the configured maximum size for incoming JSON request bodies.
func RequestBodyLimit(cfg *setting.Cfg) web.Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if cfg.MaxRequestBodyBytes > 0 && shouldLimitRequestBody(r) {
				limitedBody := http.MaxBytesReader(w, r.Body, cfg.MaxRequestBodyBytes)
				body, err := io.ReadAll(limitedBody)
				if err != nil {
					var maxBytesErr *http.MaxBytesError
					if errors.As(err, &maxBytesErr) {
						http.Error(w, http.StatusText(http.StatusRequestEntityTooLarge), http.StatusRequestEntityTooLarge)
						return
					}

					http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
					return
				}

				r.Body = io.NopCloser(bytes.NewReader(body))
			}

			next.ServeHTTP(w, r)
		})
	}
}

func shouldLimitRequestBody(r *http.Request) bool {
	switch r.Method {
	case http.MethodPost, http.MethodPut, http.MethodPatch:
	default:
		return false
	}

	return isJSONContentType(r.Header.Get("Content-Type"))
}

func isJSONContentType(contentType string) bool {
	if contentType == "" {
		return false
	}

	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return strings.HasPrefix(strings.ToLower(contentType), "application/json")
	}

	return mediaType == "application/json"
}
