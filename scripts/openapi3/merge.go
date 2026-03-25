package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"reflect"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
	"github.com/getkin/kin-openapi/openapi3"
)

// mergeOpenAPI3FromSwagger2Files reads Swagger 2.0 JSON files, converts each to OpenAPI 3,
// and merges paths and components in order. This avoids converting an already-merged Swagger 2
// document and matches go-swagger mixin's per-file merge semantics more closely.
func mergeOpenAPI3FromSwagger2Files(inputs []string) (*openapi3.T, error) {
	if len(inputs) == 0 {
		return nil, fmt.Errorf("no input swagger 2 files")
	}
	var merged *openapi3.T
	for _, path := range inputs {
		doc, err := swagger2FileToOpenAPI3(path)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", path, err)
		}
		if merged == nil {
			merged = doc
			continue
		}
		if err := mergeOpenAPIDocs(merged, doc); err != nil {
			return nil, fmt.Errorf("merge after %s: %w", path, err)
		}
	}
	// Match legacy openapi3conv output: single server so paths resolve under /api.
	merged.Servers = openapi3.Servers{{URL: "/api"}}
	return merged, nil
}

func swagger2FileToOpenAPI3(path string) (*openapi3.T, error) {
	byt, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var doc2 openapi2.T
	if err := json.Unmarshal(byt, &doc2); err != nil {
		return nil, err
	}
	return openapi2conv.ToV3(&doc2)
}

func mergeOpenAPIDocs(dst, src *openapi3.T) error {
	if err := mergePaths(dst.Paths, src.Paths); err != nil {
		return err
	}
	if err := mergeComponentsIntoPtr(&dst.Components, src.Components); err != nil {
		return err
	}
	mergeTags(&dst.Tags, src.Tags)
	if len(src.Security) > 0 && len(dst.Security) == 0 {
		dst.Security = src.Security
	}
	return nil
}

func mergePaths(dst, src *openapi3.Paths) error {
	if src == nil || src.Len() == 0 {
		return nil
	}
	if dst == nil {
		return fmt.Errorf("destination paths is nil")
	}
	for path, srcItem := range src.Map() {
		if srcItem == nil {
			continue
		}
		existing := dst.Value(path)
		if existing == nil {
			cloned, err := clonePathItem(srcItem)
			if err != nil {
				return fmt.Errorf("path %q: %w", path, err)
			}
			dst.Set(path, cloned)
			continue
		}
		if err := mergePathItems(path, existing, srcItem); err != nil {
			return err
		}
	}
	return nil
}

func mergePathItems(path string, dst, src *openapi3.PathItem) error {
	if src.Ref != "" || dst.Ref != "" {
		return fmt.Errorf("path %q: cannot merge path items with $ref", path)
	}
	for _, method := range []string{
		http.MethodConnect,
		http.MethodDelete,
		http.MethodGet,
		http.MethodHead,
		http.MethodOptions,
		http.MethodPatch,
		http.MethodPost,
		http.MethodPut,
		http.MethodTrace,
	} {
		srcOp := src.GetOperation(method)
		if srcOp == nil {
			continue
		}
		if dst.GetOperation(method) != nil {
			return fmt.Errorf("path %q: duplicate %s operation", path, method)
		}
		dst.SetOperation(method, srcOp)
	}
	dst.Parameters = append(dst.Parameters, src.Parameters...)
	if dst.Summary == "" {
		dst.Summary = src.Summary
	}
	if dst.Description == "" {
		dst.Description = src.Description
	}
	dst.Servers = append(dst.Servers, src.Servers...)
	return nil
}

func clonePathItem(p *openapi3.PathItem) (*openapi3.PathItem, error) {
	if p == nil {
		return nil, nil
	}
	byt, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}
	var c openapi3.PathItem
	if err := json.Unmarshal(byt, &c); err != nil {
		return nil, err
	}
	return &c, nil
}

func mergeComponentsIntoPtr(dst **openapi3.Components, src *openapi3.Components) error {
	if src == nil || reflect.ValueOf(*src).IsZero() {
		return nil
	}
	if *dst == nil {
		c := openapi3.NewComponents()
		*dst = &c
	}
	return mergeComponentsInto(*dst, *src)
}

func mergeComponentsInto(dst *openapi3.Components, src openapi3.Components) error {
	if dst == nil {
		return fmt.Errorf("nil components destination")
	}
	if err := mergeStringKeyedMap(&dst.Schemas, src.Schemas, "schemas"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.Parameters, src.Parameters, "parameters"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.Headers, src.Headers, "headers"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.RequestBodies, src.RequestBodies, "requestBodies"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.Responses, src.Responses, "responses"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.SecuritySchemes, src.SecuritySchemes, "securitySchemes"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.Examples, src.Examples, "examples"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.Links, src.Links, "links"); err != nil {
		return err
	}
	if err := mergeStringKeyedMap(&dst.Callbacks, src.Callbacks, "callbacks"); err != nil {
		return err
	}
	return nil
}

func mergeStringKeyedMap[M ~map[string]V, V any](dst *M, src M, section string) error {
	if len(src) == 0 {
		return nil
	}
	if *dst == nil {
		*dst = make(M)
	}
	for k, v := range src {
		if existing, exists := (*dst)[k]; exists {
			eq, err := jsonEqual(existing, v)
			if err != nil {
				return fmt.Errorf("%s: compare component %q: %w", section, k, err)
			}
			if eq {
				continue
			}
			// go-swagger mixin uses --ignore-conflicts: keep the first definition when names collide.
			continue
		}
		(*dst)[k] = v
	}
	return nil
}

func jsonEqual(a, b any) (bool, error) {
	ja, err := json.Marshal(a)
	if err != nil {
		return false, err
	}
	jb, err := json.Marshal(b)
	if err != nil {
		return false, err
	}
	return string(ja) == string(jb), nil
}

func mergeTags(dst *openapi3.Tags, src openapi3.Tags) {
	if len(src) == 0 {
		return
	}
	seen := make(map[string]struct{}, len(*dst))
	for _, t := range *dst {
		if t != nil {
			seen[t.Name] = struct{}{}
		}
	}
	for _, t := range src {
		if t == nil {
			continue
		}
		if _, ok := seen[t.Name]; ok {
			continue
		}
		seen[t.Name] = struct{}{}
		*dst = append(*dst, t)
	}
}

func validateOpenAPI3(doc *openapi3.T) error {
	// Unmarshal through Loader so internal $refs are resolved before Validate (same as LoadFromFile).
	byt, err := json.Marshal(doc)
	if err != nil {
		return err
	}
	loader := openapi3.NewLoader()
	loaded, err := loader.LoadFromData(byt)
	if err != nil {
		return err
	}
	return loaded.Validate(context.Background(), openapi3.DisableExamplesValidation())
}
