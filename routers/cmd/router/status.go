package router

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// statusCmd represents the status command
var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show the status of the Aether Mailer router",
	Long: `Show the current status of the Aether Mailer router, including
running state, health status, configuration, and performance metrics.
This command connects to the router's API endpoint to retrieve status information.`,
	Run: func(cmd *cobra.Command, args []string) {
		showStatus()
	},
}

func init() {
	statusCmd.Flags().String("endpoint", "http://localhost:80/api/v1/status", "router status endpoint")
	statusCmd.Flags().Bool("json", false, "output status in JSON format")
	statusCmd.Flags().Bool("health", false, "show detailed health information")
	statusCmd.Flags().Bool("metrics", false, "show performance metrics")
	statusCmd.Flags().Int("timeout", 5, "request timeout in seconds")

	viper.BindPFlag("status.endpoint", statusCmd.Flags().Lookup("endpoint"))
	viper.BindPFlag("status.json", statusCmd.Flags().Lookup("json"))
	viper.BindPFlag("status.health", statusCmd.Flags().Lookup("health"))
	viper.BindPFlag("status.metrics", statusCmd.Flags().Lookup("metrics"))
	viper.BindPFlag("status.timeout", statusCmd.Flags().Lookup("timeout"))
}

// showStatus displays the router status
func showStatus() {
	endpoint := viper.GetString("status.endpoint")
	jsonOutput := viper.GetBool("status.json")
	showHealth := viper.GetBool("status.health")
	showMetrics := viper.GetBool("status.metrics")
	timeout := viper.GetInt("status.timeout")

	if verbose {
		fmt.Printf("Querying status from: %s\n", endpoint)
		fmt.Printf("Timeout: %d seconds\n", timeout)
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}

	// Get basic status
	status, err := getRouterStatus(client, endpoint)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting router status: %v\n", err)
		os.Exit(1)
	}

	// Output status
	if jsonOutput {
		outputJSON(status)
	} else {
		outputStatus(status, showHealth, showMetrics)
	}

	// Get additional information if requested
	if showHealth {
		showHealthStatus(client, endpoint)
	}

	if showMetrics {
		showMetricsStatus(client, endpoint)
	}
}

// RouterStatus represents the router status response
type RouterStatus struct {
	Success bool `json:"success"`
	Data    struct {
		Status      string                 `json:"status"`
		Uptime      float64                `json:"uptime"`
		Version     string                 `json:"version"`
		Environment string                 `json:"environment"`
		Services    map[string]interface{} `json:"services"`
		Endpoints   map[string]string      `json:"endpoints"`
		Timestamp   string                 `json:"timestamp"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// getRouterStatus retrieves the router status from the API
func getRouterStatus(client *http.Client, endpoint string) (*RouterStatus, error) {
	resp, err := client.Get(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to router: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("router returned status %d", resp.StatusCode)
	}

	var status RouterStatus
	if err := json.NewDecoder(resp.Body).Decode(&status); err != nil {
		return nil, fmt.Errorf("failed to decode status response: %w", err)
	}

	return &status, nil
}

// outputStatus outputs the status in human-readable format
func outputStatus(status *RouterStatus, showHealth, showMetrics bool) {
	fmt.Println("=== Aether Mailer Router Status ===")
	fmt.Printf("Status:      %s\n", status.Data.Status)
	fmt.Printf("Version:     %s\n", status.Data.Version)
	fmt.Printf("Environment: %s\n", status.Data.Environment)
	fmt.Printf("Uptime:      %.2f seconds\n", status.Data.Uptime)
	fmt.Printf("Timestamp:   %s\n", status.Data.Timestamp)

	// Show services status
	if len(status.Data.Services) > 0 {
		fmt.Println("\n--- Services ---")
		for name, info := range status.Data.Services {
			if serviceInfo, ok := info.(map[string]interface{}); ok {
				status, _ := serviceInfo["status"].(string)
				fmt.Printf("%-12s: %s\n", name, status)
			}
		}
	}

	// Show endpoints
	if len(status.Data.Endpoints) > 0 {
		fmt.Println("\n--- Endpoints ---")
		for name, url := range status.Data.Endpoints {
			fmt.Printf("%-12s: %s\n", name, url)
		}
	}

	// Show additional info if requested
	if showHealth || showMetrics {
		fmt.Println("\n--- Additional Information ---")
		if showHealth {
			fmt.Println("Health: Detailed health information requested")
		}
		if showMetrics {
			fmt.Println("Metrics: Performance metrics requested")
		}
	}
}

// outputJSON outputs the status in JSON format
func outputJSON(status *RouterStatus) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(status); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}

// showHealthStatus shows detailed health information
func showHealthStatus(client *http.Client, baseEndpoint string) {
	healthEndpoint := baseEndpoint + "/health"

	resp, err := client.Get(healthEndpoint)
	if err != nil {
		fmt.Printf("Error getting health status: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Health endpoint returned status %d\n", resp.StatusCode)
		return
	}

	var health map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		fmt.Printf("Error decoding health response: %v\n", err)
		return
	}

	fmt.Println("\n=== Health Status ===")
	if data, ok := health["data"].(map[string]interface{}); ok {
		if status, ok := data["status"].(string); ok {
			fmt.Printf("Overall: %s\n", status)
		}
		if components, ok := data["components"].(map[string]interface{}); ok {
			fmt.Println("Components:")
			for name, info := range components {
				if compInfo, ok := info.(map[string]interface{}); ok {
					if status, ok := compInfo["status"].(string); ok {
						fmt.Printf("  %-12s: %s\n", name, status)
					}
				}
			}
		}
	}
}

// showMetricsStatus shows performance metrics
func showMetricsStatus(client *http.Client, baseEndpoint string) {
	metricsEndpoint := baseEndpoint + "/balancer/metrics"

	resp, err := client.Get(metricsEndpoint)
	if err != nil {
		fmt.Printf("Error getting metrics: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Metrics endpoint returned status %d\n", resp.StatusCode)
		return
	}

	var metrics map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&metrics); err != nil {
		fmt.Printf("Error decoding metrics response: %v\n", err)
		return
	}

	fmt.Println("\n=== Performance Metrics ===")
	if data, ok := metrics["data"].(map[string]interface{}); ok {
		if totalRequests, ok := data["total_requests"].(float64); ok {
			fmt.Printf("Total Requests: %.0f\n", totalRequests)
		}
		if requestsPerAlg, ok := data["requests_per_alg"].(map[string]interface{}); ok {
			fmt.Println("Requests per Algorithm:")
			for alg, count := range requestsPerAlg {
				if count, ok := count.(float64); ok {
					fmt.Printf("  %-12s: %.0f\n", alg, count)
				}
			}
		}
		if lastUpdated, ok := data["last_updated"].(string); ok {
			fmt.Printf("Last Updated: %s\n", lastUpdated)
		}
	}
}
