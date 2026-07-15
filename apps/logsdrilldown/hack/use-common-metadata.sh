#!/usr/bin/env bash

set -euo pipefail

generated_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../plugin/src/generated" && pwd)"

while IFS= read -r metadata_file; do
  cat > "${metadata_file}" <<'EOF'
// Code generated - EDITING IS FUTILE. DO NOT EDIT.

import { CommonMetadata, defaultCommonMetadata } from '../../types.common.gen';

export type Metadata = CommonMetadata;
export const defaultMetadata = defaultCommonMetadata;
EOF
done < <(find "${generated_dir}" -mindepth 3 -maxdepth 3 -name 'types.metadata.gen.ts' -type f | sort)
