package router

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
)

// logsCmd represents the logs command
var logsCmd = &cobra.Command{
	Use:   "logs",
	Short: "Show and follow router logs",
	Long: `Display and monitor logs from the Aether Mailer router.
This command allows you to view real-time logs, filter by level,
search content, and follow log output.`,
}

func init() {
	rootCmd.AddCommand(logsCmd)
	
	// Add subcommands
	logsCmd.AddCommand(logsShowCmd)
	logsCmd.AddCommand(logsFollowCmd)
	logsCmd.AddCommand(logsTailCmd)
	logsCmd.AddCommand(logsSearchCmd)
	logsCmd.AddCommand(logsClearCmd)
}

// logsShowCmd represents the logs show command
var logsShowCmd = &cobra.Command{
	Use:   "show",
	Short: "Show router logs",
	Long: `Display router logs with optional filtering.
Shows existing log entries without real-time following.`,
	Run: func(cmd *cobra.Command, args []string) {
		showLogs()
	},
}

// logsFollowCmd represents the logs follow command
var logsFollowCmd = &cobra.Command{
	Use:   "follow [service]",
	Short: "Follow router logs in real-time",
	Long: `Follow router logs in real-time, similar to tail -f.
Optionally specify a specific service to follow its logs only.`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		followLogs(args)
	},
}

// logsTailCmd represents the logs tail command
var logsTailCmd = &cobra.Command{
	Use:   "tail [number]",
	Short: "Show last N lines of logs",
	Long: `Display the last N lines of router logs, similar to tail -n.
Defaults to 100 lines if not specified.`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		tailLogs(args)
	},
}

// logsSearchCmd represents the logs search command
var logsSearchCmd = &cobra.Command{
	Use:   "search [pattern]",
	Short: "Search logs for specific pattern",
	Long: `Search router logs for lines matching the specified pattern.
Supports regular expressions for advanced searching.`,
	Args: cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		searchLogs(args)
	},
}

// logsClearCmd represents the logs clear command
var logsClearCmd = &cobra.Command{
	Use:   "clear",
	Short: "Clear router logs",
	Long: `Clear all router logs from storage.
This removes all stored log entries.`,
	Run: func(cmd *cobra.Command, args []string) {
		clearLogs()
	},
}

func init() {
	// logs show flags
	logsShowCmd.Flags().String("level", "", "filter by log level (debug, info, warn, error)")
	logsShowCmd.Flags().String("service", "", "filter by service name")
	logsShowCmd.Flags().String("since", "", "show logs since this duration (e.g., 1h, 30m)")
	logsShowCmd.Flags().String("until", "", "show logs until this time")
	logsShowCmd.Flags().Bool("json", false, "output logs in JSON format")
	logsShowCmd.Flags().Int("limit", 0, "limit number of log entries")
	logsShowCmd.Flags().String("format", "text", "output format (text, json)")
	logsShowCmd.Flags().String("endpoint", "http://localhost:8080/logs", "router logs API endpoint")
	
	viper.BindPFlag("logs.show.level", logsShowCmd.Flags().Lookup("level"))
	viper.BindPFlag("logs.show.service", logsShowCmd.Flags().Lookup("service"))
	viper.BindPFlag("logs.show.since", logsShowCmd.Flags().Lookup("since"))
	viper.BindPFlag("logs.show.until", logsShowCmd.Flags().Lookup("until"))
	viper.BindPFlag("logs.show.json", logsShowCmd.Flags().Lookup("json"))
	viper.BindPFlag("logs.show.limit", logsShowCmd.Flags().Lookup("limit"))
	viper.BindPFlag("logs.show.format", logsShowCmd.Flags().Lookup("format"))
	viper.BindPFlag("logs.show.endpoint", logsShowCmd.Flags().Lookup("endpoint"))
	
	// logs follow flags
	logsFollowCmd.Flags().String("level", "", "filter by log level")
	logsFollowCmd.Flags().String("service", "", "filter by service name")
	logsFollowCmd.Flags().String("since", "", "show logs since this duration")
	logsFollowCmd.Flags().String("format", "text", "output format (text, json)")
	logsFollowCmd.Flags().String("endpoint", "http://localhost:8080/logs", "router logs API endpoint")
	
	viper.BindPFlag("logs.follow.level", logsFollowCmd.Flags().Lookup("level"))
	viper.BindPFlag("logs.follow.service", logsFollowCmd.Flags().Lookup("service"))
	viper.BindPFlag("logs.follow.since", logsFollowCmd.Flags().Lookup("since"))
	viper.BindPFlag("logs.follow.format", logsFollowCmd.Flags().Lookup("format"))
	viper.BindPFlag("logs.follow.endpoint", logsFollowCmd.Flags().Lookup("endpoint"))
	
	// logs tail flags
	logsTailCmd.Flags().Int("lines", 100, "number of lines to show")
	logsTailCmd.Flags().String("level", "", "filter by log level")
	logsTailCmd.Flags().String("service", "", "filter by service name")
	logsTailCmd.Flags().String("format", "text", "output format (text, json)")
	logsTailCmd.Flags().String("endpoint", "http://localhost:8080/logs", "router logs API endpoint")
	
	viper.BindPFlag("logs.tail.lines", logsTailCmd.Flags().Lookup("lines"))
	viper.BindPFlag("logs.tail.level", logsTailCmd.Flags().Lookup("level"))
	viper.BindPFlag("logs.tail.service", logsTailCmd.Flags().Lookup("service"))
	viper.BindPFlag("logs.tail.format", logsTailCmd.Flags().Lookup("format"))
	viper.BindPFlag("logs.tail.endpoint", logsTailCmd.Flags().Lookup("endpoint"))
	
	// logs search flags
	logsSearchCmd.Flags().String("level", "", "filter by log level")
	logsSearchCmd.Flags().String("service", "", "filter by service name")
	logsSearchCmd.Flags().String("since", "", "search logs since this duration")
	logsSearchCmd.Flags().String("until", "", "search logs until this time")
	logsSearchCmd.Flags().Int("limit", 50, "limit number of search results")
	logsSearchCmd.Flags().Bool("regex", false, "use regular expression for pattern")
	logsSearchCmd.Flags().Bool("case-sensitive", false, "case sensitive search")
	logsSearchCmd.Flags().String("format", "text", "output format (text, json)")
	logsSearchCmd.Flags().String("endpoint", "http://localhost:8080/logs", "router logs API endpoint")
	
	viper.BindPFlag("logs.search.level", logsSearchCmd.Flags().Lookup("level"))
	viper.BindPFlag("logs.search.service", logsSearchCmd.Flags().Lookup("service"))
	viper.BindPFlag("logs.search.since", logsSearchCmd.Flags().Lookup("since"))
	viper.BindPFlag("logs.search.until", logsSearchCmd.Flags().Lookup("until"))
	viper.BindPFlag("logs.search.limit", logsSearchCmd.Flags().Lookup("limit"))
	viper.BindPFlag("logs.search.regex", logsSearchCmd.Flags().Lookup("regex"))
	viper.BindPFlag("logs.search.case_sensitive", logsSearchCmd.Flags().Lookup("case_sensitive"))
	viper.BindPFlag("logs.search.format", logsSearchCmd.Flags().Lookup("format"))
	viper.BindPFlag("logs.search.endpoint", logsSearchCmd.Flags().Lookup("endpoint"))
	
	// logs clear flags
	logsClearCmd.Flags().Bool("all", false, "clear all logs (default: router logs only)")
	logsClearCmd.Flags().String("service", "", "clear logs for specific service")
	logsClearCmd.Flags().String("endpoint", "http://localhost:8080/logs", "router logs API endpoint")
	
	viper.BindPFlag("logs.clear.all", logsClearCmd.Flags().Lookup("all"))
	viper.BindPFlag("logs.clear.service", logsClearCmd.Flags().Lookup("service"))
	viper.BindPFlag("logs.clear.endpoint", logsClearCmd.Flags().Lookup("endpoint"))
}

// LogEntry represents a log entry
type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Service  string    `json:"service"`
	Message  string    `json:"message"`
	Error    string    `json:"error,omitempty"`
	Fields   map[string]interface{} `json:"fields,omitempty"`
}

// showLogs displays logs with optional filtering
func showLogs() {
	endpoint := viper.GetString("logs.show.endpoint")
	level := viper.GetString("logs.show.level")
	service := viper.GetString("logs.show.service")
	since := viper.GetString("logs.show.since")
	until := viper.GetString("logs.show.until")
	jsonOutput := viper.GetBool("logs.show.json")
	format := viper.GetString("logs.show.format")
	limit := viper.GetInt("logs.show.limit")
	
	if verbose {
		fmt.Printf("Querying logs from: %s\n", endpoint)
		if level != "" {
			fmt.Printf("Level filter: %s\n", level)
		}
		if service != "" {
			fmt.Printf("Service filter: %s\n", service)
		}
		if since != "" {
			fmt.Printf("Since: %s\n", since)
		}
		if until != "" {
			fmt.Printf("Until: %s\n", until)
		}
		if limit > 0 {
			fmt.Printf("Limit: %d\n", limit)
		}
	}
	
	// Build query parameters
	params := url.Values{}
	if level != "" {
		params.Add("level", level)
	}
	if service != "" {
		params.Add("service", service)
	}
	if since != "" {
		params.Add("since", since)
	}
	if until != "" {
		params.Add("until", until)
	}
	if limit > 0 {
		params.Add("limit", strconv.Itoa(limit))
	}
	
	// Request logs
	url := endpoint + "?" + params.Encode()
	client := &http.Client{Timeout: 30 * time.Second}
	
	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching logs: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Logs API returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}
	
	// Parse and display logs
	if err := displayLogs(resp.Body, format, jsonOutput); err != nil {
		fmt.Fprintf(os.Stderr, "Error displaying logs: %v\n", err)
		os.Exit(1)
	}
}

// followLogs follows logs in real-time
func followLogs(args []string) {
	endpoint := viper.GetString("logs.follow.endpoint")
	level := viper.GetString("logs.follow.level")
	service := viper.GetString("logs.follow.service")
	since := viper.GetString("logs.follow.since")
	format := viper.GetString("logs.follow.format")
	
	// Determine service to follow
	targetService := "router"
	if len(args) > 0 {
		targetService = args[0]
	}
	
	if verbose {
		fmt.Printf("Following logs from: %s\n", endpoint)
		fmt.Printf("Level filter: %s\n", level)
		fmt.Printf("Service filter: %s\n", service)
		fmt.Printf("Target service: %s\n", targetService)
		if since != "" {
			fmt.Printf("Since: %s\n", since)
		}
	}
	
	// Create SSE connection for real-time logs
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	// Handle signals for graceful exit
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	
	go func() {
		<-sigChan
		if verbose {
			fmt.Println("\nStopping log following...")
		}
		cancel()
	}()
	
	// Follow logs via SSE
	url := fmt.Sprintf("%s/follow?service=%s&level=%s&since=%s&format=%s", 
		endpoint, targetService, level, since, format)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating request: %v\n", err)
		os.Exit(1)
	}
	req = req.WithContext(ctx)
	
	client := &http.Client{
		Timeout: 0, // No timeout for streaming
	}
	
	resp, err := client.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting to logs endpoint: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Logs follow endpoint returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}
	
	// Stream SSE events
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		if err := ctx.Err(); err != nil {
			break
		}
		
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			// SSE data line
			data := strings.TrimPrefix(line, "data: ")
			if err := processLogEntry(data, format); err != nil {
				fmt.Fprintf(os.Stderr, "Error processing log entry: %v\n", err)
			}
		} else if line == "event: heartbeat" {
			if verbose {
				fmt.Printf("[%s] ✅ Connection alive\n", time.Now().Format("15:04:05"))
			}
		} else if strings.HasPrefix(line, "event: error") {
			fmt.Fprintf(os.Stderr, "[%s] ❌ Log streaming error\n", time.Now().Format("15:04:05"))
			break
		}
	}
}

// tailLogs shows the last N lines of logs
func tailLogs(args []string) {
	endpoint := viper.GetString("logs.tail.endpoint")
	lines := viper.GetInt("logs.tail.lines")
	level := viper.GetString("logs.tail.level")
	service := viper.GetString("logs.tail.service")
	format := viper.GetString("logs.tail.format")
	
	if verbose {
		fmt.Printf("Tailing last %d lines from: %s\n", lines, endpoint)
		if level != "" {
			fmt.Printf("Level filter: %s\n", level)
		}
		if service != "" {
			fmt.Printf("Service filter: %s\n", service)
		}
	}
	
	// Build query parameters
	params := url.Values{}
	params.Add("lines", strconv.Itoa(lines))
	if level != "" {
		params.Add("level", level)
	}
	if service != "" {
		params.Add("service", service)
	}
	params.Add("format", format)
	
	// Request logs
	url := endpoint + "?" + params.Encode()
	client := &http.Client{Timeout: 30 * time.Second}
	
	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching logs: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Logs tail endpoint returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}
	
	// Parse and display logs
	if err := displayLogs(resp.Body, format, false); err != nil {
		fmt.Fprintf(os.Stderr, "Error displaying logs: %v\n", err)
		os.Exit(1)
	}
}

// searchLogs searches logs for a specific pattern
func searchLogs(args []string) {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "Error: search pattern is required\n")
		os.Exit(1)
	}
	
	pattern := args[0]
	endpoint := viper.GetString("logs.search.endpoint")
	level := viper.GetString("logs.search.level")
	service := viper.GetString("logs.search.service")
	since := viper.GetString("logs.search.since")
	until := viper.GetString("logs.search.until")
	limit := viper.GetInt("logs.search.limit")
	regex := viper.GetBool("logs.search.regex")
	caseSensitive := viper.GetBool("logs.search.case_sensitive")
	format := viper.GetString("logs.search.format")
	
	if verbose {
		fmt.Printf("Searching logs for pattern: %s\n", pattern)
		fmt.Printf("Endpoint: %s\n", endpoint)
		fmt.Printf("Level filter: %s\n", level)
		fmt.Printf("Service filter: %s\n", service)
		fmt.Printf("Regex: %v\n", regex)
		fmt.Printf("Case sensitive: %v\n", caseSensitive)
		fmt.Printf("Since: %s\n", since)
		fmt.Printf("Until: %s\n", until)
		fmt.Printf("Limit: %d\n", limit)
	}
	
	// Build query parameters
	params := url.Values{}
	params.Add("q", pattern)
	if level != "" {
		params.Add("level", level)
	}
	if service != "" {
		params.Add("service", service)
	}
	if since != "" {
		params.Add("since", since)
	}
	if until != "" {
		params.Add("until", until)
	}
	if limit > 0 {
		params.Add("limit", strconv.Itoa(limit))
	}
	params.Add("regex", strconv.FormatBool(regex))
	params.Add("case_sensitive", strconv.FormatBool(caseSensitive))
	params.Add("format", format)
	
	// Request logs
	url := endpoint + "/search?" + params.Encode()
	client := &http.Client{Timeout: 30 * time.Second}
	
	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error searching logs: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Logs search endpoint returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}
	
	// Parse and display results
	if err := displaySearchResults(resp.Body, format); err != nil {
		fmt.Fprintf(os.Stderr, "Error displaying search results: %v\n", err)
		os.Exit(1)
	}
}

// clearLogs clears router logs
func clearLogs() {
	endpoint := viper.GetString("logs.clear.endpoint")
	all := viper.GetBool("logs.clear.all")
	service := viper.GetString("logs.clear.service")
	
	if verbose {
		fmt.Printf("Clearing logs from: %s\n", endpoint)
		if all {
			fmt.Println("Clearing all logs")
		}
		if service != "" {
			fmt.Printf("Service filter: %s\n", service)
		}
	}
	
	// Build query parameters
	params := url.Values{}
	if all {
		params.Add("all", "true")
	} else if service != "" {
		params.Add("service", service)
	}
	
	// Request log clearing
	url := endpoint + "/clear?" + params.Encode()
	client := &http.Client{Timeout: 30 * time.Second}
	
	resp, err := client.Post(url, "application/json", nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error clearing logs: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		fmt.Fprintf(os.Stderr, "Logs clear endpoint returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}
	
	fmt.Println("✅ Logs cleared successfully")
}

// displayLogs displays log entries
func displayLogs(body io.Reader, format string, jsonOutput bool) error {
	var entries []LogEntry
	
	if format == "json" || jsonOutput {
		decoder := json.NewDecoder(body)
		if err := decoder.Decode(&entries); err != nil {
			return err
		}
		
		for _, entry := range entries {
			if jsonOutput {
				encoder := json.NewEncoder(os.Stdout)
				encoder.Encode(entry)
			} else {
				outputLogEntry(entry)
			}
		}
	} else {
		// Text format - simple line by line
		scanner := bufio.NewScanner(body)
		for scanner.Scan() {
			line := scanner.Text()
			// Parse simple log format: timestamp [level] service: message
			if entry := parseSimpleLog(line) {
				outputLogEntry(entry)
			} else {
				fmt.Println(line)
			}
		}
	}
	
	return nil
}

// displaySearchResults displays search results
func displaySearchResults(body io.Reader, format string) error {
	var results struct {
		Total int       `json:"total"`
		Entries []LogEntry `json:"entries"`
	}
	
	if format == "json" {
		decoder := json.NewDecoder(body)
		if err := decoder.Decode(&results); err != nil {
			return err
		}
		
		for _, entry := range results.Entries {
			encoder := json.NewEncoder(os.Stdout)
			encoder.Encode(entry)
		}
		
		fmt.Printf("\nSearch completed. Found %d matches.\n", results.Total)
	} else {
		// Text format
		scanner := bufio.NewScanner(body)
		count := 0
		for scanner.Scan() {
			line := scanner.Text()
			if entry := parseSimpleLog(line); entry {
				outputLogEntry(entry)
				count++
			}
		}
		
		fmt.Printf("\nSearch completed. Found %d matches.\n", count)
	}
	
	return nil
}

// processLogEntry processes a single log entry
func processLogEntry(data string, format string) error {
	var entry LogEntry
	if err := json.Unmarshal([]byte(data), &entry); err != nil {
		return err
	}
	
	if format == "json" {
		encoder := json.NewEncoder(os.Stdout)
		return encoder.Encode(entry)
	} else {
		outputLogEntry(entry)
	}
	
	return nil
}

// outputLogEntry outputs a log entry in text format
func outputLogEntry(entry LogEntry) {
	timestamp := entry.Timestamp.Format("2006-01-02 15:04:05")
	
	fmt.Printf("%s [%s] %s: %s\n", 
		timestamp, entry.Level, entry.Service, entry.Message)
	
	if entry.Error != "" {
		fmt.Printf("  Error: %s\n", entry.Error)
	}
	
	if len(entry.Fields) > 0 {
		fmt.Println("  Fields:")
		for key, value := range entry.Fields {
			fmt.Printf("    %s: %v\n", key, value)
		}
	}
}

// parseSimpleLog parses a simple text log format
func parseSimpleLog(line string) *LogEntry {
	// Expected format: timestamp [level] service: message
	parts := strings.SplitN(line, " ", 4)
	if len(parts) < 4 {
		return nil
	}
	
	timestamp, err := time.Parse("2006-01-02 15:04:05", parts[0])
	if err != nil {
		return nil
	}
	
	// Extract level from brackets
	level := strings.Trim(parts[1], "[]")
	
	// Combine service and message
	serviceMessage := strings.Join(parts[2:], " ")
	serviceParts := strings.SplitN(serviceMessage, ":", 2)
	if len(serviceParts) < 2 {
		return nil
	}
	
	service := strings.TrimSpace(serviceParts[0])
	message := strings.TrimSpace(strings.Join(serviceParts[1:], ":"))
	
	return &LogEntry{
		Timestamp: timestamp,
		Level:     level,
		Service:  service,
		Message:  message,
	}
}