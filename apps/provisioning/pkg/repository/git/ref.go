package git

import "regexp"

// commitHashRegex matches full (40) or abbreviated (7-39) git commit hashes.
var commitHashRegex = regexp.MustCompile(`^[0-9a-fA-F]{7,40}$`)

// IsValidGitRef checks whether a git ref is a valid branch name or commit hash.
// An empty ref is considered valid because callers may omit it to use the repository default.
func IsValidGitRef(ref string) bool {
	if ref == "" {
		return true
	}

	if commitHashRegex.MatchString(ref) {
		return true
	}

	return IsValidGitBranchName(ref)
}
