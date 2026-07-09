package web

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

type StructWithInt struct {
	A int `binding:"Required"`
}

type StructWithPrimitives struct {
	A int     `binding:"Required"`
	B string  `binding:"Required"`
	C bool    `binding:"Required"`
	D float64 `binding:"Required"`
}

type StructWithPrivateFields struct {
	A int `binding:"Required"` // must be validated
	b int `binding:"Required"` // will not be used
}

type StructWithInterface struct {
	A any `binding:"Required"`
}
type StructWithSliceInts struct {
	A []int `binding:"Required"`
}
type StructWithSliceStructs struct {
	A []StructWithInt `binding:"Required"`
}
type StructWithSliceInterfaces struct {
	A []any `binding:"Required"`
}
type StructWithStruct struct {
	A StructWithInt `binding:"Required"`
}
type StructWithStructPointer struct {
	A *StructWithInt `binding:"Required"`
}
type StructWithValidation struct {
	A int
}

func (sv StructWithValidation) Validate() error {
	if sv.A < 10 {
		return errors.New("too small")
	}
	return nil
}

type StructWithPointerValidation struct {
	A int
}

func (sv *StructWithPointerValidation) Validate() error {
	if sv.A < 10 {
		return errors.New("too small")
	}
	return nil
}

func TestValidationSuccess(t *testing.T) {
	var nilInterface *StructWithPointerValidation

	for _, x := range []any{
		nil,
		42,
		"foo",
		struct{ A int }{},
		StructWithInt{42},
		StructWithPrimitives{42, "foo", true, 12.34},
		StructWithPrivateFields{12, 0},
		StructWithInterface{"foo"},
		StructWithSliceInts{[]int{1, 2, 3}},
		StructWithSliceInterfaces{[]any{1, 2, 3}},
		StructWithSliceStructs{[]StructWithInt{{1}, {2}}},
		StructWithStruct{StructWithInt{3}},
		StructWithStructPointer{&StructWithInt{3}},
		StructWithValidation{42},
		&StructWithPointerValidation{42},
		nilInterface,
	} {
		if err := validate(x); err != nil {
			t.Error("Validation failed:", x, err)
		}
	}
}
func TestValidationFailure(t *testing.T) {
	for i, x := range []any{
		StructWithInt{0},
		StructWithPrimitives{0, "foo", true, 12.34},
		StructWithPrimitives{42, "", true, 12.34},
		StructWithPrimitives{42, "foo", false, 12.34},
		StructWithPrimitives{42, "foo", true, 0},
		StructWithPrivateFields{0, 1},
		StructWithInterface{},
		StructWithInterface{nil},
		StructWithSliceInts{},
		StructWithSliceInts{[]int{}},
		StructWithSliceStructs{[]StructWithInt{}},
		StructWithSliceStructs{[]StructWithInt{{0}, {2}}},
		StructWithSliceStructs{[]StructWithInt{{2}, {0}}},
		StructWithSliceInterfaces{[]any{}},
		StructWithSliceInterfaces{nil},
		StructWithStruct{StructWithInt{}},
		StructWithStruct{StructWithInt{0}},
		StructWithStructPointer{},
		StructWithStructPointer{&StructWithInt{}},
		StructWithValidation{2},
		&StructWithPointerValidation{2},
	} {
		if err := validate(x); err == nil {
			t.Error("Validation should fail:", i, x)
		}
	}
}

func TestBindWithLimit(t *testing.T) {
	type payload struct {
		Name string `json:"name"`
	}

	t.Run("oversized JSON body returns ErrRequestBodyTooLarge", func(t *testing.T) {
		body := strings.Repeat("a", 1024)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"name":"`+body+`"}`))
		req.Header.Set("Content-Type", "application/json")

		var got payload
		err := BindWithLimit(req, &got, 64)
		require.ErrorIs(t, err, ErrRequestBodyTooLarge)
		require.Equal(t, http.StatusRequestEntityTooLarge, StatusCodeFromBindError(err))
	})

	t.Run("disabled limit allows larger JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader([]byte(`{"name":"ok"}`)))
		req.Header.Set("Content-Type", "application/json")

		var got payload
		err := BindWithLimit(req, &got, 0)
		require.NoError(t, err)
		require.Equal(t, "ok", got.Name)
	})

	t.Run("uses package default limit", func(t *testing.T) {
		t.Cleanup(func() {
			MaxRequestBodyBytes = 0
		})

		MaxRequestBodyBytes = 32
		body := strings.Repeat("a", 128)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"name":"`+body+`"}`))
		req.Header.Set("Content-Type", "application/json")

		var got payload
		err := Bind(req, &got)
		require.ErrorIs(t, err, ErrRequestBodyTooLarge)
	})
}
