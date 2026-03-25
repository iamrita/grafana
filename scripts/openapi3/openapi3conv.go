package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
	"github.com/getkin/kin-openapi/openapi3"
)

// This tool:
//   - Post-processes Swagger 2 JSON (cleanup mode) for go-swagger output quirks.
//   - Converts Swagger 2 to OpenAPI 3 (single-file mode, legacy).
//   - Merges multiple Swagger 2 files by converting each to OpenAPI 3 then merging (merge mode).
//   - Validates an OpenAPI 3 document (validate mode).
func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		usage()
		os.Exit(2)
	}

	switch args[0] {
	case "cleanup":
		for _, f := range args[1:] {
			postProcessSwaggerFile(f)
		}
	case "merge":
		if len(args) < 4 {
			fmt.Fprintln(os.Stderr, "usage: openapi3conv merge <swagger2.json> [...] <openapi3-out.json>")
			os.Exit(2)
		}
		outFile := args[len(args)-1]
		inputs := args[1 : len(args)-1]
		merged, err := mergeOpenAPI3FromSwagger2Files(inputs)
		if err != nil {
			panic(err)
		}
		if err := validateOpenAPI3(merged); err != nil {
			panic(fmt.Errorf("validate merged OpenAPI 3: %w", err))
		}
		writeOpenAPI3(outFile, merged)
	case "validate":
		if len(args) != 2 {
			fmt.Fprintln(os.Stderr, "usage: openapi3conv validate <openapi3.json>")
			os.Exit(2)
		}
		if err := validateOpenAPI3File(args[1]); err != nil {
			panic(err)
		}
		fmt.Printf("OpenAPI 3 document is valid: %s\n", args[1])
	default:
		// Legacy: [input swagger2] [output openapi3]
		inFile := args[0]
		outFile := "public/openapi3.json"
		if len(args) > 1 && args[1] != "" {
			outFile = args[1]
		}
		convertSingleSwagger2ToOpenAPI3(inFile, outFile)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, `openapi3conv — OpenAPI 3 helpers for Grafana API specs

  openapi3conv cleanup <file1.json> [file2.json ...]
      Post-process Swagger 2 JSON files in place.

  openapi3conv merge <a.json> <b.json> [...] <out-openapi3.json>
      Convert each Swagger 2 file to OpenAPI 3 and merge paths/components.

  openapi3conv validate <openapi3.json>
      Validate an OpenAPI 3 document.

  openapi3conv [<swagger2.json> [openapi3-out.json]]
      Convert a single Swagger 2 file to OpenAPI 3 (default out: public/openapi3.json).`)
}

func convertSingleSwagger2ToOpenAPI3(inFile, outFile string) {
	fmt.Printf("Reading swagger 2 file %s\n", inFile)
	byt, err := os.ReadFile(inFile)
	if err != nil {
		panic(err)
	}

	var doc2 openapi2.T
	if err = json.Unmarshal(byt, &doc2); err != nil {
		panic(err)
	}

	doc3, err := openapi2conv.ToV3(&doc2)
	if err != nil {
		panic(err)
	}

	doc3.AddServer(&openapi3.Server{URL: "/api"})

	if err := validateOpenAPI3(doc3); err != nil {
		panic(fmt.Errorf("validate OpenAPI 3: %w", err))
	}
	writeOpenAPI3(outFile, doc3)
}

func writeOpenAPI3(outFile string, doc *openapi3.T) {
	j3, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		panic(err)
	}
	if err = os.WriteFile(outFile, j3, 0o644); err != nil {
		panic(err)
	}
	fmt.Printf("OpenAPI specs generated in file %s\n", outFile)
}

func validateOpenAPI3File(path string) error {
	byt, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var doc openapi3.T
	if err := json.Unmarshal(byt, &doc); err != nil {
		return err
	}
	return validateOpenAPI3(&doc)
}

func postProcessSwaggerFile(inFile string) {
	fmt.Printf("Reading swagger file %s\n", inFile)
	byt, err := os.ReadFile(inFile)
	if err != nil {
		panic(err)
	}
	jj := string(byt)
	var processed string

	// Replace the URL property
	idx := strings.Index(jj, `    "URL": {`)
	if idx > 0 {
		after := jj[idx:]
		edx := strings.Index(after, `"Unstructured": {`)
		if edx > 0 {
			processed = jj[0:idx] + `    "URL": { 
			"type": "string", 
			"format": "url" 
		},
		` + after[edx:]
		}
	}

	if len(processed) > 0 {
		if err = os.WriteFile(inFile, []byte(processed), 0o644); err != nil {
			panic(err)
		}
		fmt.Printf("Processed file %s\n", inFile)
		return
	}
	fmt.Printf("Nothing found in file %s\n", inFile)
}
