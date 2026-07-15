package main

import "testing"

func TestParseRuntimeMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		args    []string
		want    runtimeMode
		wantErr bool
	}{
		{name: "default to api", args: nil, want: modeAPI},
		{name: "api", args: []string{"api"}, want: modeAPI},
		{name: "server alias", args: []string{"server"}, want: modeAPI},
		{name: "invalid", args: []string{"invalid"}, wantErr: true},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			got, err := parseRuntimeMode(tc.args)
			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.want {
				t.Fatalf("expected %q, got %q", tc.want, got)
			}
		})
	}
}
