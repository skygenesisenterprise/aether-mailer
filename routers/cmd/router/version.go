package router

import (
	"fmt"
	"runtime"

	"github.com/spf13/cobra"
)

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Show the version information",
	Long: `Display version information for the Aether Mailer Router.
This command shows the build version, Go version, and system information.`,
	Run: func(cmd *cobra.Command, args []string) {
		showVersion()
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)

	// Add version flags
	versionCmd.Flags().Bool("detailed", false, "show detailed version information")
	versionCmd.Flags().Bool("json", false, "output version in JSON format")

	// Note: We don't bind these to viper as they're informational only
}

// showVersion displays version information
func showVersion() {
	detailed := false
	jsonOutput := false

	// Get flag values from command line
	for i, flag := range versionCmd.Flags() {
		if flag.Name == "detailed" && flag.Changed {
			detailed = true
		}
		if flag.Name == "json" && flag.Changed {
			jsonOutput = true
		}
	}

	// Version information
	version := "0.1.0"
	buildDate := "2025-01-15"
	gitCommit := "dev"
	gitBranch := "main"

	if jsonOutput {
		outputVersionJSON(version, buildDate, gitCommit, gitBranch, detailed)
	} else {
		outputVersion(version, buildDate, gitCommit, gitBranch, detailed)
	}
}

// outputVersion displays version information in human-readable format
func outputVersion(version, buildDate, gitCommit, gitBranch string, detailed bool) {
	fmt.Println("=== Aether Mailer Router ===")
	fmt.Printf("Version:     %s\n", version)
	fmt.Printf("Build Date:  %s\n", buildDate)

	if detailed {
		fmt.Printf("Git Commit:  %s\n", gitCommit)
		fmt.Printf("Git Branch:  %s\n", gitBranch)
		fmt.Printf("Go Version:  %s\n", runtime.Version())
		fmt.Printf("Go OS/Arch: %s/%s\n", runtime.GOOS, runtime.GOARCH)
		fmt.Printf("Compiler:    %s\n", runtime.Compiler)

		// Show runtime information
		fmt.Println("\n--- Runtime Information ---")
		fmt.Printf("Goroutines:  %d\n", runtime.NumGoroutine())
		fmt.Printf("CPU Cores:    %d\n", runtime.NumCPU())

		// Show memory information
		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		fmt.Printf("Memory Alloc: %d KB\n", m.Alloc/1024)
		fmt.Printf("Total Alloc: %d KB\n", m.TotalAlloc/1024)
		fmt.Printf("Sys Memory:  %d KB\n", m.Sys/1024)
		fmt.Printf("Num GC:      %d\n", m.NumGC)
	}

	// Show usage tip
	fmt.Printf("\nFor more information, visit: https://github.com/skygenesisenterprise/aether-mailer\n")
}

// outputVersionJSON displays version information in JSON format
func outputVersionJSON(version, buildDate, gitCommit, gitBranch string, detailed bool) {
	type VersionInfo struct {
		Version   string `json:"version"`
		BuildDate string `json:"build_date"`
		GitCommit string `json:"git_commit"`
		GitBranch string `json:"git_branch"`
		GoVersion string `json:"go_version"`
		GoOS      string `json:"go_os"`
		GoArch    string `json:"go_arch"`
		Compiler  string `json:"compiler"`
	}

	type RuntimeInfo struct {
		Goroutines int    `json:"goroutines"`
		CPUCores   int    `json:"cpu_cores"`
		MemAlloc   uint64 `json:"memory_alloc_kb"`
		MemTotal   uint64 `json:"memory_total_alloc_kb"`
		SysMemory  uint64 `json:"sys_memory_kb"`
		NumGC      uint32 `json:"num_gc"`
	}

	info := VersionInfo{
		Version:   version,
		BuildDate: buildDate,
		GitCommit: gitCommit,
		GitBranch: gitBranch,
		GoVersion: runtime.Version(),
		GoOS:      runtime.GOOS,
		GoArch:    runtime.GOARCH,
		Compiler:  runtime.Compiler,
	}

	output := map[string]interface{}{
		"version": info,
	}

	if detailed {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)

		runtimeInfo := RuntimeInfo{
			Goroutines: runtime.NumGoroutine(),
			CPUCores:   runtime.NumCPU(),
			MemAlloc:   m.Alloc / 1024,
			MemTotal:   m.TotalAlloc / 1024,
			SysMemory:  m.Sys / 1024,
			NumGC:      m.NumGC,
		}

		output["runtime"] = runtimeInfo
	}

	// Output JSON
	encoder := json.NewEncoder(cmd.OutOrStdout())
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(output); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}
